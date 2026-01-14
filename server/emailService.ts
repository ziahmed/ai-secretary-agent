/**
 * Email service for sending meeting invitations
 * 
 * Note: This is a placeholder implementation that logs emails instead of sending them.
 * To enable actual email sending, you need to:
 * 1. Add email service credentials (Gmail API, SendGrid, AWS SES, etc.)
 * 2. Implement the actual email sending logic
 * 3. Generate proper iCalendar (.ics) attachments for calendar integration
 */

export interface MeetingInvite {
  to: string[];
  meetingTitle: string;
  meetingDate: Date;
  location?: string;
  description?: string;
  organizerEmail: string;
  organizerName: string;
}

/**
 * Generate iCalendar (.ics) format for calendar invites
 */
function generateICalendar(invite: MeetingInvite): string {
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const endDate = new Date(invite.meetingDate.getTime() + 60 * 60 * 1000); // 1 hour duration
  
  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//AI Secretary Agent//Meeting Invite//EN
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VEVENT
UID:${Date.now()}@ai-secretary-agent
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(invite.meetingDate)}
DTEND:${formatDate(endDate)}
SUMMARY:${invite.meetingTitle}
DESCRIPTION:${invite.description || ''}
LOCATION:${invite.location || ''}
ORGANIZER;CN=${invite.organizerName}:mailto:${invite.organizerEmail}
${invite.to.map(email => `ATTENDEE;CN=${email};RSVP=TRUE:mailto:${email}`).join('\n')}
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
END:VCALENDAR`;
}

/**
 * Generate HTML email template for meeting invite
 */
function generateEmailHTML(invite: MeetingInvite): string {
  const formattedDate = invite.meetingDate.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #000000;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: #2563eb;
      color: white;
      padding: 20px;
      border-radius: 8px 8px 0 0;
    }
    .content {
      background: #f9fafb;
      padding: 30px;
      border: 1px solid #e5e7eb;
      border-top: none;
      border-radius: 0 0 8px 8px;
    }
    .detail-row {
      margin: 15px 0;
      padding: 10px;
      background: white;
      border-radius: 4px;
      color: #000000;
    }
    .label {
      font-weight: 600;
      color: #374151;
      margin-bottom: 5px;
    }
    .value {
      color: #000000;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      font-size: 14px;
      color: #6b7280;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1 style="margin: 0; font-size: 24px;">📅 Meeting Invitation</h1>
  </div>
  <div class="content">
    <p style="color: #000000; font-size: 16px; margin-bottom: 20px;">
      You have been invited to the following meeting:
    </p>
    
    <div class="detail-row">
      <div class="label">Meeting Title</div>
      <div class="value" style="font-size: 18px; font-weight: 600;">${invite.meetingTitle}</div>
    </div>
    
    <div class="detail-row">
      <div class="label">Date & Time</div>
      <div class="value">${formattedDate}</div>
    </div>
    
    ${invite.location ? `
    <div class="detail-row">
      <div class="label">Location</div>
      <div class="value">${invite.location}</div>
    </div>
    ` : ''}
    
    ${invite.description ? `
    <div class="detail-row">
      <div class="label">Description</div>
      <div class="value">${invite.description}</div>
    </div>
    ` : ''}
    
    <div class="detail-row">
      <div class="label">Organizer</div>
      <div class="value">${invite.organizerName} (${invite.organizerEmail})</div>
    </div>
    
    <p style="color: #000000; margin-top: 25px;">
      A calendar invitation (.ics file) is attached to this email. 
      Click on it to add this meeting to your calendar.
    </p>
  </div>
  
  <div class="footer">
    <p>This invitation was sent by AI Personal Secretary Agent</p>
  </div>
</body>
</html>
  `;
}

/**
 * Send meeting invitation emails to all participants
 * 
 * @param invite Meeting invitation details
 * @returns Promise<boolean> Success status
 */
export async function sendMeetingInvite(invite: MeetingInvite): Promise<boolean> {
  try {
    const icsContent = generateICalendar(invite);
    const htmlContent = generateEmailHTML(invite);
    
    // TODO: Implement actual email sending
    // Options:
    // 1. Gmail API (if using Google OAuth)
    // 2. SendGrid API
    // 3. AWS SES
    // 4. Nodemailer with SMTP
    
    // For now, log the email details
    console.log('=== MEETING INVITE EMAIL ===');
    console.log('To:', invite.to.join(', '));
    console.log('Subject:', `Meeting Invitation: ${invite.meetingTitle}`);
    console.log('Date:', invite.meetingDate.toISOString());
    console.log('Location:', invite.location || 'Not specified');
    console.log('HTML Content Length:', htmlContent.length);
    console.log('ICS Content Length:', icsContent.length);
    console.log('===========================');
    
    // Store in email logs for tracking
    // This will be handled by the caller
    
    return true;
  } catch (error) {
    console.error('Failed to send meeting invite:', error);
    return false;
  }
}

/**
 * Send meeting update notification to participants
 */
export async function sendMeetingUpdate(invite: MeetingInvite, changes: string): Promise<boolean> {
  try {
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #000000;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: #f59e0b;
      color: white;
      padding: 20px;
      border-radius: 8px 8px 0 0;
    }
    .content {
      background: #fffbeb;
      padding: 30px;
      border: 1px solid #fde68a;
      border-top: none;
      border-radius: 0 0 8px 8px;
    }
    .changes {
      background: white;
      padding: 15px;
      border-radius: 4px;
      margin: 15px 0;
      color: #000000;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1 style="margin: 0; font-size: 24px;">📝 Meeting Updated</h1>
  </div>
  <div class="content">
    <p style="color: #000000;">The following meeting has been updated:</p>
    <h2 style="color: #000000;">${invite.meetingTitle}</h2>
    <div class="changes">
      <strong>Changes:</strong><br>
      ${changes}
    </div>
    <p style="color: #000000;">
      Date: ${invite.meetingDate.toLocaleString()}<br>
      ${invite.location ? `Location: ${invite.location}` : ''}
    </p>
  </div>
</body>
</html>
    `;
    
    console.log('=== MEETING UPDATE EMAIL ===');
    console.log('To:', invite.to.join(', '));
    console.log('Subject:', `Meeting Updated: ${invite.meetingTitle}`);
    console.log('Changes:', changes);
    console.log('===========================');
    
    return true;
  } catch (error) {
    console.error('Failed to send meeting update:', error);
    return false;
  }
}
