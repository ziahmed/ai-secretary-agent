import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mic, Square, Loader2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

interface AudioRecorderProps {
  meetingId: number;
  onTranscriptComplete?: (transcript: string) => void;
}

export function AudioRecorder({ meetingId, onTranscriptComplete }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioSize, setAudioSize] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);


  const uploadAudioMutation = trpc.transcription.uploadAudio.useMutation();
  const transcribeMutation = trpc.transcription.transcribe.useMutation();

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        } 
      });

      // Check browser support for different mime types
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4',
      ];
      
      let selectedMimeType = '';
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          break;
        }
      }

      if (!selectedMimeType) {
        throw new Error('No supported audio format found in your browser');
      }

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: selectedMimeType,
      });

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          
          // Update audio size estimate
          const totalSize = audioChunksRef.current.reduce((acc, chunk) => acc + chunk.size, 0);
          setAudioSize(totalSize / (1024 * 1024)); // Convert to MB
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop all audio tracks
        stream.getTracks().forEach(track => track.stop());
        
        // Process the recording
        await processRecording();
      };

      // Start recording
      mediaRecorder.start(1000); // Collect data every second
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      setRecordingTime(0);
      setAudioSize(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      toast.success('Your microphone is now recording');
    } catch (error) {
      console.error('Failed to start recording:', error);
      toast.error(error instanceof Error ? error.message : 'Could not access microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const processRecording = async () => {
    setIsProcessing(true);

    try {
      // Create blob from chunks
      const audioBlob = new Blob(audioChunksRef.current, { 
        type: mediaRecorderRef.current?.mimeType || 'audio/webm' 
      });

      // Check size limit (16MB)
      const sizeMB = audioBlob.size / (1024 * 1024);
      if (sizeMB > 16) {
        throw new Error(`Recording is too large (${sizeMB.toFixed(2)}MB). Maximum size is 16MB.`);
      }

      toast.loading('Uploading audio file...');

      // Convert to base64
      const base64Audio = await blobToBase64(audioBlob);
      
      // Upload to S3
      const uploadResult = await uploadAudioMutation.mutateAsync({
        audioData: base64Audio,
        mimeType: audioBlob.type,
        meetingId,
      });

      toast.loading('Transcribing audio with Whisper AI...');

      // Transcribe with Whisper
      const transcriptResult = await transcribeMutation.mutateAsync({
        audioUrl: uploadResult.audioUrl,
        meetingId,
        language: 'en',
      });

      toast.success(`Transcription complete - ${transcriptResult.transcript.length} characters`);

      // Callback with transcript
      if (onTranscriptComplete) {
        onTranscriptComplete(transcriptResult.transcript);
      }

    } catch (error) {
      console.error('Failed to process recording:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to transcribe audio');
    } finally {
      setIsProcessing(false);
      audioChunksRef.current = [];
    }
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Remove data URL prefix (e.g., "data:audio/webm;base64,")
        const base64Data = base64String.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Audio Recording</h3>
          {isRecording && (
            <div className="flex items-center gap-2 text-red-600">
              <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
              <span className="font-mono text-sm">{formatTime(recordingTime)}</span>
            </div>
          )}
        </div>

        {isRecording && (
          <div className="text-sm text-muted-foreground">
            Recording size: {audioSize.toFixed(2)} MB / 16 MB max
          </div>
        )}

        <div className="flex gap-2">
          {!isRecording && !isProcessing && (
            <Button onClick={startRecording} className="flex-1">
              <Mic className="w-4 h-4 mr-2" />
              Start Recording
            </Button>
          )}

          {isRecording && (
            <Button onClick={stopRecording} variant="destructive" className="flex-1">
              <Square className="w-4 h-4 mr-2" />
              Stop Recording
            </Button>
          )}

          {isProcessing && (
            <Button disabled className="flex-1">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </Button>
          )}
        </div>

        <div className="text-xs text-muted-foreground">
          <p>• Recording captures your microphone audio only</p>
          <p>• Maximum recording size: 16MB</p>
          <p>• Transcription uses Whisper AI (free)</p>
        </div>
      </div>
    </Card>
  );
}
