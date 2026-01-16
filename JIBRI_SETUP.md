# Jibri Recording Setup Guide

This guide explains how to set up automatic recording processing for Jitsi Meet video conferences.

## Overview

The application includes a webhook endpoint that can receive recording completion notifications, automatically transcribe the audio using Whisper AI, and upload transcripts to Google Drive.

## Webhook Endpoint

**URL:** `https://your-app-url.com/api/trpc/webhook.jitsiRecordingComplete`

**Method:** POST

**Payload:**
```json
{
  "roomName": "meet.jit.si/RoomCode",
  "recordingUrl": "https://storage.example.com/recording.mp4",
  "recordingId": "optional-id",
  "duration": 3600,
  "timestamp": "2026-01-15T20:00:00Z"
}
```

## Setup Options

### Option 1: Self-Hosted Jitsi with Jibri (Recommended for Production)

If you need automatic recording processing, you'll need to set up your own Jitsi instance with Jibri:

1. **Set up Jitsi Meet server** (requires a dedicated server/VPS)
   - Follow official guide: https://jitsi.github.io/handbook/docs/devops-guide/devops-guide-quickstart
   - Minimum requirements: 4GB RAM, 2 CPU cores, Ubuntu 20.04/22.04

2. **Install and configure Jibri** (recording component)
   - Follow guide: https://jitsi.github.io/handbook/docs/devops-guide/devops-guide-docker/#jibri
   - Jibri records meetings and saves them to configured storage

3. **Configure webhook notifications**
   - Add webhook URL to Jibri configuration
   - Configure Jibri to send POST request to webhook endpoint when recording completes
   - Include recording URL in the webhook payload

4. **Update meeting link generation**
   - Change `generateMeetLink` in `server/routers.ts` to use your Jitsi domain
   - Replace `meet.jit.si` with your domain (e.g., `meet.yourcompany.com`)

### Option 2: Manual Upload (Current Implementation)

The application currently supports manual transcript upload:

1. Record meeting using Jitsi Meet's built-in recording feature
2. Download the recording file
3. Use a speech-to-text service to transcribe (or use the app's transcription API)
4. Upload transcript through the meeting detail page

### Option 3: Browser-Based Recording with Automatic Processing

For a simpler solution without self-hosting Jitsi:

1. **Capture recording in browser** using MediaRecorder API
2. **Upload to your storage** (the app already has S3 storage configured)
3. **Trigger transcription** automatically after upload
4. **Process and save** transcript to Google Drive

This option requires frontend modifications to capture the meeting audio/video stream.

## Webhook Processing Flow

When a webhook is received:

1. **Extract room code** from the `roomName` parameter
2. **Find matching meeting** in database by searching `meetLink` field
3. **Download recording** from the provided `recordingUrl`
4. **Transcribe audio** using Whisper AI (built-in service)
   - Supports multiple audio formats (mp3, wav, webm, m4a, mp4)
   - 16MB file size limit
   - Automatic language detection
5. **Upload transcript** to Google Drive
   - Saved in folder: `Meeting Transcripts/{Meeting Title}/`
   - Filename: `{Meeting Title} - Transcript (Auto).txt`
6. **Update meeting record** with transcript URL
7. **Return success** response with transcript details

## Testing the Webhook

You can test the webhook endpoint manually using curl:

\`\`\`bash
curl -X POST https://your-app-url.com/api/trpc/webhook.jitsiRecordingComplete \\
  -H "Content-Type: application/json" \\
  -d '{
    "roomName": "test-room-123",
    "recordingUrl": "https://example.com/sample-audio.mp3"
  }'
\`\`\`

## Current Limitations

1. **Public Jitsi (meet.jit.si)** does not support custom webhooks
   - Recordings are stored in Dropbox (user's account)
   - No automatic webhook notifications
   - Manual download and upload required

2. **File size limit** for transcription is 16MB
   - Longer meetings may exceed this limit
   - Consider audio compression or splitting for long recordings

3. **Transcription language** is currently set to English
   - Can be modified in webhook.ts if needed

## Recommended Production Setup

For full automation:

1. **Deploy self-hosted Jitsi Meet** on a dedicated server
2. **Configure Jibri** with webhook support
3. **Set up storage** for recordings (S3, Google Cloud Storage, etc.)
4. **Configure webhook** to point to your application
5. **Update meeting links** to use your Jitsi domain

Estimated setup time: 4-8 hours
Monthly cost: $20-50 (depending on server size and usage)

## Alternative: Zoom/Google Meet Integration

If self-hosting is not feasible, consider integrating with:
- **Zoom API** - Supports automatic recording and transcript generation
- **Google Meet API** - Supports recording with Google Workspace
- **Microsoft Teams** - Supports recording and transcription

These services provide built-in recording and transcription features with API access.

## Support

For questions about Jitsi setup, refer to:
- Official Jitsi documentation: https://jitsi.github.io/handbook/
- Jitsi community forum: https://community.jitsi.org/
- Jibri GitHub: https://github.com/jitsi/jibri
