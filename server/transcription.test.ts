import { describe, it, expect, vi, beforeEach } from 'vitest';
import { appRouter } from './routers';
import type { Context } from './_core/context';
import * as storage from './storage';
import * as voiceTranscription from './_core/voiceTranscription';
import * as db from './db';

// Mock dependencies
vi.mock('./storage');
vi.mock('./_core/voiceTranscription');
vi.mock('./db');

describe('Transcription Router', () => {
  let mockContext: Context;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup mock context with authenticated user
    mockContext = {
      user: {
        id: 1,
        openId: 'test-user-123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
        createdAt: new Date(),
      },
      req: {} as any,
      res: {} as any,
    };
  });

  describe('uploadAudio', () => {
    it('should upload audio to S3 and return URL', async () => {
      // Mock S3 upload
      const mockUrl = 'https://s3.example.com/recordings/1/meeting-123-1234567890.webm';
      vi.mocked(storage.storagePut).mockResolvedValue({
        url: mockUrl,
        key: 'recordings/1/meeting-123-1234567890.webm',
      });

      // Create test audio data (small base64 string)
      const testAudioData = Buffer.from('fake audio data').toString('base64');

      const caller = appRouter.createCaller(mockContext);
      const result = await caller.transcription.uploadAudio({
        audioData: testAudioData,
        mimeType: 'audio/webm',
        meetingId: 123,
      });

      expect(result.success).toBe(true);
      expect(result.audioUrl).toBe(mockUrl);
      expect(result.fileSize).toBeLessThan(1); // Should be very small
      expect(storage.storagePut).toHaveBeenCalledWith(
        expect.stringContaining('recordings/1/meeting-123-'),
        expect.any(Buffer),
        'audio/webm'
      );
    });

    it('should reject files larger than 16MB', async () => {
      // Create a large base64 string (>16MB)
      const largeData = Buffer.alloc(17 * 1024 * 1024).toString('base64');

      const caller = appRouter.createCaller(mockContext);
      
      await expect(
        caller.transcription.uploadAudio({
          audioData: largeData,
          mimeType: 'audio/webm',
          meetingId: 123,
        })
      ).rejects.toThrow('Audio file too large');
    });

    it('should handle upload errors gracefully', async () => {
      vi.mocked(storage.storagePut).mockRejectedValue(new Error('S3 upload failed'));

      const testAudioData = Buffer.from('fake audio data').toString('base64');
      const caller = appRouter.createCaller(mockContext);

      await expect(
        caller.transcription.uploadAudio({
          audioData: testAudioData,
          mimeType: 'audio/webm',
          meetingId: 123,
        })
      ).rejects.toThrow('S3 upload failed');
    });
  });

  describe('transcribe', () => {
    it('should transcribe audio and save to meeting', async () => {
      // Mock Whisper API response
      const mockTranscript = {
        task: 'transcribe' as const,
        language: 'en',
        duration: 120.5,
        text: 'This is a test transcript from the meeting.',
        segments: [
          {
            id: 0,
            seek: 0,
            start: 0.0,
            end: 5.0,
            text: 'This is a test transcript',
            tokens: [1, 2, 3],
            temperature: 0.0,
            avg_logprob: -0.5,
            compression_ratio: 1.2,
            no_speech_prob: 0.01,
          },
        ],
      };

      vi.mocked(voiceTranscription.transcribeAudio).mockResolvedValue(mockTranscript);
      vi.mocked(db.updateMeeting).mockResolvedValue({
        id: 123,
        title: 'Test Meeting',
        transcript: mockTranscript.text,
      } as any);

      const caller = appRouter.createCaller(mockContext);
      const result = await caller.transcription.transcribe({
        audioUrl: 'https://s3.example.com/audio.webm',
        meetingId: 123,
        language: 'en',
      });

      expect(result.success).toBe(true);
      expect(result.transcript).toBe(mockTranscript.text);
      expect(result.language).toBe('en');
      expect(result.duration).toBe(120.5);
      expect(result.segments).toHaveLength(1);

      // Verify meeting was updated with transcript
      expect(db.updateMeeting).toHaveBeenCalledWith(123, {
        transcript: mockTranscript.text,
      });
    });

    it('should handle transcription errors', async () => {
      // Mock Whisper API error
      vi.mocked(voiceTranscription.transcribeAudio).mockResolvedValue({
        error: 'Transcription failed',
        code: 'TRANSCRIPTION_FAILED',
        details: 'Audio format not supported',
      });

      const caller = appRouter.createCaller(mockContext);

      await expect(
        caller.transcription.transcribe({
          audioUrl: 'https://s3.example.com/audio.webm',
          meetingId: 123,
        })
      ).rejects.toThrow('Transcription failed');
    });

    it('should handle database update errors', async () => {
      const mockTranscript = {
        task: 'transcribe' as const,
        language: 'en',
        duration: 60.0,
        text: 'Test transcript',
        segments: [],
      };

      vi.mocked(voiceTranscription.transcribeAudio).mockResolvedValue(mockTranscript);
      vi.mocked(db.updateMeeting).mockRejectedValue(new Error('Database error'));

      const caller = appRouter.createCaller(mockContext);

      await expect(
        caller.transcription.transcribe({
          audioUrl: 'https://s3.example.com/audio.webm',
          meetingId: 123,
        })
      ).rejects.toThrow('Database error');
    });

    it('should work without language parameter', async () => {
      const mockTranscript = {
        task: 'transcribe' as const,
        language: 'en',
        duration: 30.0,
        text: 'Auto-detected language transcript',
        segments: [],
      };

      vi.mocked(voiceTranscription.transcribeAudio).mockResolvedValue(mockTranscript);
      vi.mocked(db.updateMeeting).mockResolvedValue({} as any);

      const caller = appRouter.createCaller(mockContext);
      const result = await caller.transcription.transcribe({
        audioUrl: 'https://s3.example.com/audio.webm',
        meetingId: 123,
        // No language parameter
      });

      expect(result.success).toBe(true);
      expect(result.transcript).toBe(mockTranscript.text);
      
      // Verify transcribeAudio was called without language
      expect(voiceTranscription.transcribeAudio).toHaveBeenCalledWith({
        audioUrl: 'https://s3.example.com/audio.webm',
        language: undefined,
        prompt: 'Transcribe this meeting recording',
      });
    });
  });

  describe('Integration Flow', () => {
    it('should complete full upload → transcribe flow', async () => {
      // Step 1: Upload audio
      const mockAudioUrl = 'https://s3.example.com/recordings/1/meeting-456-1234567890.webm';
      vi.mocked(storage.storagePut).mockResolvedValue({
        url: mockAudioUrl,
        key: 'recordings/1/meeting-456-1234567890.webm',
      });

      const testAudioData = Buffer.from('fake audio data').toString('base64');
      const caller = appRouter.createCaller(mockContext);

      const uploadResult = await caller.transcription.uploadAudio({
        audioData: testAudioData,
        mimeType: 'audio/webm',
        meetingId: 456,
      });

      expect(uploadResult.success).toBe(true);
      expect(uploadResult.audioUrl).toBe(mockAudioUrl);

      // Step 2: Transcribe uploaded audio
      const mockTranscript = {
        task: 'transcribe' as const,
        language: 'en',
        duration: 90.0,
        text: 'Full integration test transcript',
        segments: [],
      };

      vi.mocked(voiceTranscription.transcribeAudio).mockResolvedValue(mockTranscript);
      vi.mocked(db.updateMeeting).mockResolvedValue({
        id: 456,
        transcript: mockTranscript.text,
      } as any);

      const transcribeResult = await caller.transcription.transcribe({
        audioUrl: uploadResult.audioUrl,
        meetingId: 456,
        language: 'en',
      });

      expect(transcribeResult.success).toBe(true);
      expect(transcribeResult.transcript).toBe(mockTranscript.text);
      expect(db.updateMeeting).toHaveBeenCalledWith(456, {
        transcript: mockTranscript.text,
      });
    });
  });
});
