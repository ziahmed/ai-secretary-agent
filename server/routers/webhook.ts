import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";
import { transcribeAudio } from "../_core/voiceTranscription";

export const webhookRouter = router({
  // Jitsi/Jibri recording completion webhook
  jitsiRecordingComplete: publicProcedure
    .input(z.object({
      roomName: z.string(),
      recordingUrl: z.string(),
      recordingId: z.string().optional(),
      duration: z.number().optional(),
      timestamp: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      console.log('[Webhook] Jitsi recording complete:', input);

      try {
        // Find the meeting by room name
        // Room name format: meet.jit.si/{roomCode}
        const roomCode = input.roomName.split('/').pop() || input.roomName;
        const meeting = await db.getMeetingByRoomCode(roomCode);

        if (!meeting) {
          console.error(`[Webhook] Meeting not found for room code: ${roomCode}`);
          return {
            success: false,
            error: 'Meeting not found',
          };
        }

        console.log(`[Webhook] Found meeting: ${meeting.title} (ID: ${meeting.id})`);

        // Download and transcribe the recording
        console.log(`[Webhook] Starting transcription for recording: ${input.recordingUrl}`);
        
        const transcriptionResult = await transcribeAudio({
          audioUrl: input.recordingUrl,
          language: 'en',
          prompt: `Meeting: ${meeting.title}. Transcribe the meeting discussion.`,
        });

        // Check if transcription failed
        if ('error' in transcriptionResult) {
          console.error(`[Webhook] Transcription failed: ${transcriptionResult.error}`);
          return {
            success: false,
            error: `Transcription failed: ${transcriptionResult.error}`,
          };
        }

        const transcript = transcriptionResult.text;
        console.log(`[Webhook] Transcription complete. Length: ${transcript.length} characters`);

        // Upload transcript to Google Drive
        const { uploadToGoogleDrive } = await import('../googleApi');
        const transcriptFileName = `${meeting.title} - Transcript (Auto).txt`;
        const folderPath = `Meeting Transcripts/${meeting.title}`;
        
        const { fileId, webViewLink } = await uploadToGoogleDrive(
          transcriptFileName,
          transcript,
          'text/plain',
          folderPath
        );

        console.log(`[Webhook] Transcript uploaded to Google Drive: ${webViewLink}`);

        // Update meeting with transcript URL
        await db.updateMeeting(meeting.id, {
          transcriptUrl: webViewLink,
        });

        console.log(`[Webhook] Meeting ${meeting.id} updated with transcript URL`);

        // Optionally: Automatically trigger action item extraction and summary generation
        // This can be done in a background job or queued for processing

        return {
          success: true,
          meetingId: meeting.id,
          transcriptUrl: webViewLink,
          fileId,
        };
      } catch (error) {
        console.error('[Webhook] Error processing recording:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }),
});
