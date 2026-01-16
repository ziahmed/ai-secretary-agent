/**
 * Email service for sending meeting invitations using Gmail API
 * 
 * Uses Google OAuth credentials to send emails through Gmail API.
 * Requires GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN, and GOOGLE_ACCOUNT_EMAIL
 * environment variables to be configured.
 */

import { google } from 'googleapis';
import { ENV } from './_core/env';

export interface MeetingInvite {
  to: string[];
  meetingTitle: string;
  meetingDate: Date;
  location?: string;
  meetLink?: string;
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
    
    ${invite.meetLink ? `
    <div class="detail-row">
      <div class="label">Join Meeting</div>
      <div class="value">
        <a href="${invite.meetLink}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 5px;">🎥 Join Google Meet</a>
      </div>
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
 * Create Gmail API client with OAuth2 authentication
 */
function getGmailClient() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });

  return google.gmail({ version: 'v1', auth: oauth2Client });
}

/**
 * Create email message with attachments in RFC 2822 format
 */
function createEmailMessage(
  to: string[],
  subject: string,
  htmlContent: string,
  icsContent: string,
  fromEmail: string,
  fromName: string,
  cc?: string[]
): string {
  const boundary = `boundary_${Date.now()}`;
  const icsBase64 = Buffer.from(icsContent).toString('base64');
  
  const message = [
    `From: ${fromName} <${fromEmail}>`,
    `To: ${to.join(', ')}`,
    ...(cc && cc.length > 0 ? [`Cc: ${cc.join(', ')}`] : []),
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: 7bit',
    '',
    htmlContent,
    '',
    `--${boundary}`,
    'Content-Type: text/calendar; charset=UTF-8; method=REQUEST; name="invite.ics"',
    'Content-Transfer-Encoding: base64',
    'Content-Disposition: attachment; filename="invite.ics"',
    '',
    icsBase64,
    '',
    `--${boundary}--`,
  ].join('\r\n');

  return Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Send meeting invitation emails to all participants using Gmail API
 * 
 * @param invite Meeting invitation details
 * @returns Promise<boolean> Success status
 */
export async function sendMeetingInvite(invite: MeetingInvite): Promise<boolean> {
  try {
    const icsContent = generateICalendar(invite);
    const htmlContent = generateEmailHTML(invite);
    
    // Check if Gmail API credentials are configured
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_REFRESH_TOKEN) {
      console.log('=== MEETING INVITE EMAIL (Gmail API not configured) ===');
      console.log('To:', invite.to.join(', '));
      console.log('Subject:', `Meeting Invitation: ${invite.meetingTitle}`);
      console.log('Date:', invite.meetingDate.toISOString());
      console.log('Location:', invite.location || 'Not specified');
      console.log('Note: Configure Gmail API credentials to enable actual email sending');
      console.log('===========================');
      return true;
    }
    
    // Send email using Gmail API
    const gmail = getGmailClient();
    const fromEmail = process.env.GOOGLE_ACCOUNT_EMAIL || invite.organizerEmail;
    const subject = `Meeting Invitation: ${invite.meetingTitle}`;
    
    const raw = createEmailMessage(
      invite.to,
      subject,
      htmlContent,
      icsContent,
      fromEmail,
      invite.organizerName
    );

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw,
      },
    });
    
    console.log('✅ Meeting invite sent via Gmail API to:', invite.to.join(', '));
    return true;
  } catch (error) {
    console.error('Failed to send meeting invite via Gmail API:', error);
    return false;
  }
}

/**
 * Send meeting update notification to participants using Gmail API
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
    
    // Check if Gmail API credentials are configured
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_REFRESH_TOKEN) {
      console.log('=== MEETING UPDATE EMAIL (Gmail API not configured) ===');
      console.log('To:', invite.to.join(', '));
      console.log('Subject:', `Meeting Updated: ${invite.meetingTitle}`);
      console.log('Changes:', changes);
      console.log('===========================');
      return true;
    }
    
    // Send email using Gmail API
    const gmail = getGmailClient();
    const fromEmail = process.env.GOOGLE_ACCOUNT_EMAIL || invite.organizerEmail;
    const subject = `Meeting Updated: ${invite.meetingTitle}`;
    
    const boundary = `boundary_${Date.now()}`;
    const message = [
      `From: ${invite.organizerName} <${fromEmail}>`,
      `To: ${invite.to.join(', ')}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      `Content-Type: text/html; charset=UTF-8`,
      '',
      htmlContent,
    ].join('\r\n');

    const raw = Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw,
      },
    });
    
    console.log('✅ Meeting update sent via Gmail API to:', invite.to.join(', '));
    return true;
  } catch (error) {
    console.error('Failed to send meeting update:', error);
    return false;
  }
}

/**
 * Send email with CC support using Gmail API
 */
export interface EmailWithCC {
  to: string[];
  cc?: string[];
  subject: string;
  htmlContent: string;
  fromEmail: string;
  fromName: string;
}

export async function sendEmailWithCC(email: EmailWithCC): Promise<boolean> {
  try {
    // Check if Gmail API credentials are configured
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_REFRESH_TOKEN) {
      console.log('=== EMAIL WITH CC (Gmail API not configured) ===');
      console.log('To:', email.to.join(', '));
      console.log('CC:', email.cc?.join(', ') || 'None');
      console.log('Subject:', email.subject);
      console.log('Note: Configure Gmail API credentials to enable actual email sending');
      console.log('===========================');
      return true;
    }
    
    // Send email using Gmail API
    const gmail = getGmailClient();
    
    const boundary = `boundary_${Date.now()}`;
    const message = [
      `From: ${email.fromName} <${email.fromEmail}>`,
      `To: ${email.to.join(', ')}`,
      ...(email.cc && email.cc.length > 0 ? [`Cc: ${email.cc.join(', ')}`] : []),
      `Subject: ${email.subject}`,
      'MIME-Version: 1.0',
      `Content-Type: text/html; charset=UTF-8`,
      '',
      email.htmlContent,
    ].join('\r\n');

    const raw = Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw,
      },
    });
    
    console.log('✅ Email with CC sent via Gmail API to:', email.to.join(', '), 'CC:', email.cc?.join(', ') || 'None');
    return true;
  } catch (error) {
    console.error('Failed to send email with CC via Gmail API:', error);
    return false;
  }
}

/**
 * Send meeting cancellation notification to participants using Gmail API
 */
export async function sendMeetingCancellation(invite: MeetingInvite, reason: string): Promise<boolean> {
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
      background: #dc2626;
      color: white;
      padding: 20px;
      border-radius: 8px 8px 0 0;
    }
    .content {
      background: #fef2f2;
      padding: 30px;
      border: 1px solid #fecaca;
      border-top: none;
      border-radius: 0 0 8px 8px;
    }
    .reason {
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
    <h1 style="margin: 0; font-size: 24px;">❌ Meeting Cancelled</h1>
  </div>
  <div class="content">
    <p style="color: #000000;">The following meeting has been cancelled:</p>
    <h2 style="color: #000000;">${invite.meetingTitle}</h2>
    <p style="color: #000000;">
      Originally scheduled for: ${invite.meetingDate.toLocaleString()}<br>
      ${invite.location ? `Location: ${invite.location}` : ''}
    </p>
    ${reason ? `
    <div class="reason">
      <strong>Reason:</strong><br>
      ${reason}
    </div>
    ` : ''}
    <p style="color: #000000; margin-top: 20px;">
      Please remove this meeting from your calendar.
    </p>
  </div>
</body>
</html>
    `;
    
    // Check if Gmail API credentials are configured
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_REFRESH_TOKEN) {
      console.log('=== MEETING CANCELLATION EMAIL (Gmail API not configured) ===');
      console.log('To:', invite.to.join(', '));
      console.log('Subject:', `Meeting Cancelled: ${invite.meetingTitle}`);
      console.log('Reason:', reason || 'Not specified');
      console.log('===========================');
      return true;
    }
    
    // Send email using Gmail API
    const gmail = getGmailClient();
    const fromEmail = process.env.GOOGLE_ACCOUNT_EMAIL || invite.organizerEmail;
    const subject = `Meeting Cancelled: ${invite.meetingTitle}`;
    
    const message = [
      `From: ${invite.organizerName} <${fromEmail}>`,
      `To: ${invite.to.join(', ')}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      `Content-Type: text/html; charset=UTF-8`,
      '',
      htmlContent,
    ].join('\r\n');

    const raw = Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw,
      },
    });
    
    console.log('✅ Meeting cancellation sent via Gmail API to:', invite.to.join(', '));
    return true;
  } catch (error) {
    console.error('Failed to send meeting cancellation:', error);
    return false;
  }
}
