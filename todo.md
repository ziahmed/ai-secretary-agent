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
