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
