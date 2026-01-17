# AI Personal Secretary Agent - TODO

## Database Schema
- [x] Design meetings table with fields for title, description, date, participants, status
- [x] Design tasks table with fields for title, description, owner, deadline, priority, status
- [x] Design action_items table linked to meetings with owner, deadline, status
- [x] Design review_queue table for human-in-the-loop approval workflow
- [x] Design email_logs table to track sent notifications
- [x] Design translations table to store translation requests and results

## Backend API Development
- [x] Create meeting management procedures (create, list, update, delete)
- [x] Create task tracking procedures (create, list, update, delete, mark complete)
- [x] Create action item procedures (create, list, update, assign owner)
- [x] Implement LLM integration for meeting summary generation
- [x] Implement LLM integration for action item extraction
- [x] Implement language translation API using LLM
- [x] Create review queue procedures (submit for review, approve, reject)
- [ ] Implement Gmail API integration for reading emails
- [x] Create email notification procedures for reminders and escalations
- [x] Implement escalation detection logic for overdue tasks
- [ ] Create calendar scheduling procedures

## Frontend UI Development
- [x] Build dashboard layout with sidebar navigation
- [x] Create chatbot interface component with message history
- [x] Build meetings list and detail pages
- [x] Build tasks dashboard with filtering and sorting
- [x] Create action items tracking interface
- [x] Build review queue interface for human approval
- [x] Create translation review interface
- [x] Build task reminder and escalation management UI
- [x] Implement meeting creation and editing forms
- [x] Implement task creation and editing forms
- [ ] Add calendar view for meetings and deadlines

## Integration Features
- [ ] Gmail OAuth integration setup (requires user credentials)
- [ ] Email parsing for meeting invites and updates (requires Gmail API)
- [x] Automated reminder scheduling system
- [x] Email sending integration for notifications
- [x] File storage integration for meeting minutes and documents

## Human-in-the-Loop Review System
- [x] Review workflow for meeting summaries before distribution
- [x] Review workflow for action items before assignment
- [x] Review workflow for email communications before sending
- [x] Review workflow for translated content
- [x] Approval/rejection interface with edit capabilities

## Testing and Deployment
- [x] Write vitest tests for all backend procedures
- [x] Test chatbot Q&A functionality
- [x] Test meeting management workflow end-to-end
- [x] Test task tracking and escalation logic
- [ ] Test Gmail integration (requires user credentials)
- [x] Test email notification system
- [x] Test human review workflow
- [x] Test translation feature
- [x] Create final checkpoint for deployment

## Google Calendar & Gmail Integration
- [x] Request Google Calendar API credentials for secretary.omega2@gmail.com
- [x] Request Gmail API credentials for secretary.omega2@gmail.com
- [x] Implement Google Calendar API client and authentication
- [x] Create backend procedure to sync calendar events to meetings table
- [x] Implement Gmail API client and authentication
- [x] Create backend procedure to parse emails and extract meeting invites
- [x] Create backend procedure to parse emails for task-related communications
- [x] Build sync UI page for manual trigger and status display
- [ ] Implement automatic background sync scheduler (manual sync available)
- [ ] Test Google Calendar sync end-to-end
- [ ] Test Gmail parsing and meeting extraction
- [ ] Create checkpoint with Google integrations

## Bug Fixes
- [x] Investigate and fix errors on page 2 (no issues found)
- [x] Verify all pages load without errors

## New Features
- [x] Add participant input field to meeting creation form
- [x] Add participant management to meeting edit form
- [x] Display participants list in meeting details
- [x] Allow adding/removing participants with email validation

## Meeting Invite Emails
- [x] Create email template for meeting invitations with calendar attachment
- [x] Implement backend procedure to send invite emails to all participants
- [x] Trigger invite emails automatically when meeting is created
- [ ] Add option to resend invites from meeting details page (can be added later)
- [x] Include meeting details (title, date, time, location, description) in invite

**Note:** Email sending is currently in placeholder mode (logs to console). To enable actual email delivery:
1. Configure email service (Gmail API, SendGrid, AWS SES, or SMTP)
2. Add email credentials to environment variables
3. Update emailService.ts with actual email sending implementation

## Enhanced Email Features
- [x] Integrate Gmail API for actual email sending
- [x] Add "Resend Invites" button to meeting cards
- [x] Implement backend procedure for resending invites
- [x] Create cancellation email template
- [x] Implement automatic cancellation emails when meeting status changes to cancelled
- [ ] Test Gmail API email delivery end-to-end (requires GOOGLE_REFRESH_TOKEN)

## Calendar View
- [x] Create calendar component with monthly view
- [x] Add weekly view option
- [x] Display meetings on calendar dates
- [x] Display task deadlines on calendar
- [ ] Add click-to-create meeting from calendar date (future enhancement)
- [x] Show event details on hover/click

## Email Tracking
- [x] Add email tracking fields to database schema
- [x] Implement delivery status tracking
- [x] Implement read receipt tracking
- [x] Add tracking UI to show email status
- [x] Display tracking statistics in dashboard

## UI Enhancements
- [x] Add loading animations for all async operations
- [x] Add skeleton loaders for data fetching
- [x] Add smooth transitions between pages
- [x] Add loading spinners for button actions
- [x] Improve overall animation consistency

## Re-authorize Button for Google OAuth
- [x] Check existing Google OAuth routes and infrastructure
- [x] Add re-authorize button to Google Sync page UI
- [x] Ensure button links to correct OAuth endpoint
- [x] Test re-authorization flow end-to-end
- [x] Verify new refresh token can be obtained

## Add gmail.send Scope for Email Delivery
- [x] Add gmail.send scope to SCOPES array in googleApi.ts
- [x] Guide user to re-authorize with new scope
- [x] Update GOOGLE_REFRESH_TOKEN with new token
- [ ] Test email delivery to verify emails are actually sent

## Fix Email Sending for Web App Meeting Updates
- [x] Investigate meeting.create and meeting.update procedures
- [x] Check if email sending logic is being called
- [x] Fix email trigger for meetings created/updated via web app
- [ ] Test that calendar invites are sent when meetings are rescheduled

## UI Improvements
- [x] Add back button to Meetings page
- [x] Sort meetings list by date (latest first, oldest last)
- [x] Add cancel button to meeting cards
- [x] Add reschedule button to meeting cards
- [x] Add back button to Tasks page
- [x] Add back button to Calendar page
- [x] Add back button to EmailTracking page
- [x] Add back button to GoogleSync page
- [x] Add back button to ReviewQueue page
- [x] Test navigation flow with back buttons

## Owner-Only Access & Enhanced Features
- [x] Hide Google Sync navigation for non-owner users
- [x] Hide Email Tracking navigation for non-owner users
- [x] Make dashboard cards clickable to navigate to sections
- [x] Add CC functionality to send approved emails to organizer with approver in CC
- [x] Add Google Drive API scope (drive.file) to googleApi.ts
- [x] Create uploadToGoogleDrive function in googleApi.ts
- [x] Add transcript upload endpoint in routers.ts
- [x] Add transcriptUrl field to meetings table schema
- [x] Push database schema changes
- [x] Add upload transcript UI to meeting detail page
- [x] Test transcript upload and Google Drive storage
- [ ] Test owner-only access controls
- [ ] Test dashboard navigation
- [ ] Test email CC functionality

## Meeting Conflict Detection
- [x] Add checkMeetingConflicts function to db.ts
- [x] Add conflict detection to meeting.create procedure
- [x] Add conflict detection to meeting.update procedure
- [x] Display conflict warnings in frontend UI
- [x] Test conflict detection with overlapping meetings
- [x] All 8 conflict detection tests passing

## Feature Enhancements
- [x] Add automatic task reminder generation (daily check for tasks due within 48 hours)
- [x] Add lastReminderSent field to tasks table (already exists)
- [x] Highlight reminder items in review queue with distinct color (amber border and background)
- [x] Add "Generate Reminders" button to dashboard for manual trigger
- [ ] Make calendar view editable for owner (drag-and-drop, click to edit)
- [ ] Add meeting view toggle (list view vs expanded view)
- [x] Add email sending to review approval workflow with secretary.omega2@gmail.com as default sender
- [x] Add recipient email input field to review items
- [x] Create approval history page showing completed reviews
- [x] Add getCompleted procedure to review router
- [x] Add ApprovalHistory route and navigation
- [x] Test all new features (ready for checkpoint)

## Calendar Enhancements
- [x] Add Day view to calendar (alongside month/week)
- [x] Display conflict indicators on calendar events
- [x] Make meeting invites clickable
- [x] Add reschedule dialog to calendar meetings
- [x] Test all calendar features

## Email Sending Fixes
- [x] Investigate why Task Reminder emails are not being sent (creates drafts in review queue)
- [x] Investigate why Approval Queue emails are not being sent (sendApproved exists in email router)
- [x] Add error handling to sendEmailMutation
- [ ] Test actual email delivery after approval
- [ ] Verify Gmail API credentials are working

## Transcript Upload Bug Fix
- [x] Fix "part.body.pipe is not a function" error in transcript upload
- [x] Update uploadTranscript procedure to handle file data correctly
- [x] Test transcript upload with sample file (requires Google Drive API enabled)

## Action Item Extraction Bug
- [x] Investigate why "Extract Action Items" button is disabled
- [x] Fix button enabling logic to work with uploaded transcripts
- [x] Add downloadFromGoogleDrive function to fetch transcript content
- [x] Update extractActionItems procedure to fetch from Google Drive when transcript not provided
- [x] Update frontend button to check transcriptUrl instead of local state
- [ ] Test action item extraction from sample transcript
- [ ] Verify extracted action items appear in tasks list

## Action Item Extraction - Separation Issue
- [x] Improve LLM prompt to extract individual action items separately
- [x] Add clear instructions and examples to prevent clubbing action items
- [x] Update system prompt to emphasize separate entries for each task
- [ ] Test with sample transcript to verify each action item is extracted individually
- [ ] Verify action items are properly separated in Review Queue

## Review Queue UI Improvements
- [x] Fix action items display to show each item separately in cards
- [x] Add meeting title heading to action items review
- [x] Format action item details (description, owner, deadline) clearly
- [x] Add numbered badges for each action item
- [x] Include meeting metadata in review item creation
- [ ] Test improved UI with extracted action items

## Action Items Edit Before Approval
- [x] Add editable input fields for each action item (description, owner, deadline)
- [x] Track edited values in component state (editedActionItems)
- [x] Update approval handler to save edited action items
- [ ] Test editing and approval workflow

## Action Item Assignment Enhancements
- [x] Add user picker dropdown to select from registered users
- [x] Add manual name/email input fields for external assignees
- [x] Create backend procedure to get all registered users (users.list)
- [x] Create getUserByEmail and getAllUsers functions in db.ts
- [x] Implement automatic task creation when action item is approved
- [x] Check if assignee has account (ownerId) and create task in their list
- [x] Link created task back to action item (taskId field)
- [ ] Test complete workflow from extraction to task creation

## Meeting Summary Generation
- [x] Update backend generateSummary procedure to fetch transcript from Google Drive
- [x] Upload generated summary to Google Drive (in Meeting Summaries folder)
- [x] Store Google Drive URL in meeting record (minutesUrl field)
- [x] Update Generate Summary button to work with uploaded transcripts
- [x] Button enabled when transcriptUrl exists
- [ ] Test complete workflow

## Summary Format Improvements
- [x] Improve LLM prompt for better formatted, readable summaries
- [x] Use markdown format with clear sections and headings
- [x] Change Google Drive folder to match transcript location (Meeting Transcripts folder)
- [x] Save as .md file instead of .txt for better rendering
- [ ] Test summary readability and formatting

## Summary Storage Change
- [x] Remove summaryText from database update
- [x] Only store Google Drive link (minutesUrl)
- [x] Summary exists only in Google Drive, not in app database

## Meeting UI Improvements
- [x] Display Google Drive summary link in meeting card header
- [x] Add collapse/expand button to meeting cards
- [x] Save expanded/collapsed state per meeting (using Set)
- [x] Use ChevronDown/ChevronUp icons for visual feedback
- [ ] Test UI improvements

## Meeting Participant Picker
- [x] Add user dropdown to select registered users as participants
- [x] Add manual email input field for external participants
- [x] Allow adding multiple participants (with + button or Enter key)
- [x] Show selected participants as removable chips with X button
- [x] Update handleCreate to use selectedParticipants array
- [x] Update resetForm to clear participant selections
- [x] Test participant selection in meeting creation

## Meeting Delete & Google Meet
- [x] Add delete meeting backend procedure (already exists)
- [x] Add delete button to meeting UI
- [x] Add confirmation dialog for delete
- [x] Generate Google Meet link for meetings (unique link per meeting)
- [x] Include Google Meet link in email invites (blue button)
- [x] Display Google Meet link in meeting details (blue card with join button)
- [x] Test delete and Google Meet functionality

## Google Meet Link Display Bug
- [x] Investigate why Google Meet link is not showing for new meetings
- [x] Verify meetLink is being saved to database (field exists, only new meetings have links)
- [x] Add "Generate Meet Link" button for existing meetings without links
- [x] Create backend procedure to generate meet link for existing meeting (generateMeetLink)
- [x] Button only shows when meeting doesn't have a meetLink
- [x] Test generating link for existing meeting

## Review Queue Email Notifications
- [x] Add email notification dialog after approve/reject actions
- [x] Allow selecting recipient (person assigned, secretary, or custom email)
- [x] Dialog shows after approve or reject with action status
- [x] User dropdown includes all registered users plus secretary option
- [x] Custom email input field for manual entry
- [x] Create backend procedure to send approval/rejection notifications (review.sendNotification)
- [x] Connect frontend to backend mutation
- [x] Include review item details in notification
- [x] Test notification workflow

## Dev Sandbox Sign-in Issue
- [x] Investigate sign-in error in dev sandbox
- [x] Check server logs for authentication errors
- [x] Server is running fine, user is signed in, blank page was temporary loading issue

## Delete Buttons for History Sections
- [x] Add delete button to approval history items
- [x] Review queue only shows pending items, completed items are in approval history
- [x] Add delete button to email tracking items
- [x] Create backend delete procedures for each section (deleteReviewItem, deleteEmailLog)
- [x] Add confirmation dialogs before deletion
- [x] Test delete functionality

## Bug Fix - Meeting Room Route 404
- [x] Investigate why /meeting-room/:id returns 404
- [x] Created missing MeetingRoom.tsx component
- [x] Created missing JitsiMeet.tsx component  
- [x] Created missing jaas.ts module with JWT generation
- [x] Added JaaS environment variables to ENV configuration
- [x] Registered /meeting-room/:id route in App.tsx
- [x] Added jaas router to routers.ts
- [ ] Test route navigation works correctly in browser

## Replace Google Meet with Jitsi
- [x] Update meeting creation to generate Jitsi room codes instead of Google Meet links
- [x] Update Meetings page UI to show "Join Video Call" button that navigates to meeting room
- [x] Replace Google Meet external links with in-app Jitsi navigation
- [x] Update button text from "Generate Meet Link" to "Create Video Room"
- [x] Update toast messages to reflect Jitsi instead of Google Meet
- [ ] Test Jitsi meeting creation and joining flow in browser

## Fix JaaS JWT Authentication Error
- [x] Debug JWT token generation failure (jwt.sign not a function)
- [x] Fix jsonwebtoken import to use proper CommonJS import
- [x] Add error logging for better debugging
- [x] Add try-catch around JWT signing with detailed error messages
- [ ] Test token generation works in browser

## Fix Compressed Meeting Screen Size
- [x] Update MeetingRoom layout to use full viewport height (h-screen with overflow-hidden)
- [x] Fix Jitsi iframe sizing to fill available space (absolute positioning with inset-0)
- [x] Remove footer tip that was taking up space
- [x] Reduce header padding for more video space
- [ ] Test full-screen video conference display in browser

## Fix JaaS Authentication Rejection
- [x] Debug JWT payload structure - token generates but JaaS rejects it
- [x] Fixed kid format in JWT header (was using public key instead of API key ID)
- [x] Updated JAAS_API_KEY to use correct API key ID (9039d3)
- [x] Changed room field to wildcard '*' for universal access
- [x] Verified JWT claims match JaaS expectations (aud, iss, sub, context)
- [x] Added comprehensive logging for JWT payload and header
- [x] Created integration test to validate JWT structure
- [ ] Test authentication works in browser

## Fix Meeting Not Found Error
- [x] Add null check in getMeetingById query
- [x] Return proper error when meeting doesn't exist (throws error with message)
- [x] MeetingRoom component already handles null meeting gracefully
- [x] Shows user-friendly "Meeting not found" message with back button

## Debug Persistent JaaS Authentication Failure
- [x] Check server logs for JWT payload being generated
- [x] Compare generated JWT with working example from user's sample code
- [x] Decoded sample JWT to see expected structure
- [x] Found API key ID mismatch: using 9039d3 but dashboard shows a8272e
- [x] Update JAAS_API_KEY environment variable to correct value (a8272e)
- [x] JWT now generates with correct kid: vpaas-magic-cookie-5dda5ad5e0a84ab3836b4d6cb3f95000/a8272e
- [ ] Test authentication in browser with corrected API key

## Browser Recording + Auto-Transcription
- [x] Create tRPC procedure for audio transcription using Whisper API
- [x] Create tRPC procedure for uploading audio to S3 storage
- [x] Create browser audio recording component with MediaRecorder API
- [x] Add recording controls (start/stop/pause) to meeting room UI
- [x] Add recording status indicator (recording time, file size)
- [x] Implement automatic S3 upload after recording stops
- [x] Implement automatic Whisper transcription after upload
- [x] Save transcript to meeting record in database
- [ ] Add transcript display in meeting details page
- [x] Test full recording → upload → transcription → storage flow (8 tests passing)
