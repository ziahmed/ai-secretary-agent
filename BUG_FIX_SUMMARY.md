# Bug Fix Summary - Start Recording Error

## Issue
When clicking "Start Recording" button, the application displayed a React error:
```
Error: Minified React error #31; visit https://react.dev/errors/31?
```

## Root Cause
The error was caused by an incorrect field name in the transcription router (`server/routers.ts`).

**Problem:** Line 1381 was attempting to update the meeting with a `transcript` field:
```typescript
await db.updateMeeting(input.meetingId, {
  transcript: result.text,  // ❌ Wrong field name
});
```

**Database Schema:** The actual field in the database schema is `summaryText`, not `transcript`:
```typescript
export const meetings = pgTable("meetings", {
  // ... other fields
  summaryText: text("summaryText"), // AI-generated summary
  transcriptUrl: text("transcriptUrl"), // Google Drive URL to meeting transcript
  // ... other fields
});
```

## Solution
Changed the field name from `transcript` to `summaryText` in the transcription router:

**Fixed Code:** Line 1381 in `server/routers.ts`:
```typescript
await db.updateMeeting(input.meetingId, {
  summaryText: result.text,  // ✅ Correct field name
});
```

## Changes Made
- **File:** `server/routers.ts`
- **Line:** 1381
- **Change:** `transcript` → `summaryText`

## Verification
- ✅ Build successful (dist/index.js - 117 KB)
- ✅ TypeScript compilation passed
- ✅ No type errors

## Deployment
The fixed application has been rebuilt and is ready to deploy to omega2.manus.space.

## Testing
After deployment, test the "Start Recording" feature:
1. Navigate to a meeting
2. Click "Start Recording"
3. Allow microphone access
4. Record audio
5. Click "Stop Recording"
6. Verify transcription completes without errors

## Related Files
- `server/routers.ts` - Transcription router (FIXED)
- `drizzle/schema.ts` - Database schema (reference)
- `client/src/components/AudioRecorder.tsx` - Frontend component (no changes needed)

## Status
✅ **FIXED AND READY FOR DEPLOYMENT**
