import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { Student } from "../models/Student";
import { Event } from "../models/Event";

const DEFAULT_BATCH_SIZE = 50;
const DEFAULT_REMINDER_DAYS = 3;

let cachedTransporter: Transporter | null = null;
let etherealAccount: { user: string; pass: string } | null = null;

function isEmailDisabled(): boolean {
  return process.env.DISABLE_EMAIL_NOTIFICATIONS === "true";
}

async function getTransporter(): Promise<Transporter | null> {
  if (isEmailDisabled()) {
    console.log("📧 Email notifications are disabled (DISABLE_EMAIL_NOTIFICATIONS=true)");
    return null;
  }

  if (cachedTransporter) return cachedTransporter;

  // Option 1: Use SMTP URL
  const smtpUrl = process.env.SMTP_URL;
  if (smtpUrl) {
    console.log("📧 Using SMTP URL configuration");
    cachedTransporter = nodemailer.createTransport(smtpUrl);
    return cachedTransporter;
  }

  // Option 2: Use individual SMTP settings
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = process.env.SMTP_SECURE === "true";

  if (host && port && user && pass) {
    console.log(`📧 Using configured SMTP: ${host}:${port} (user: ${user})`);
    cachedTransporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass }
    });
    return cachedTransporter;
  }

  // Option 3: Use Ethereal test email in development
  if (process.env.NODE_ENV !== "production") {
    console.log("📧 No SMTP configured, creating Ethereal test account...");
    try {
      etherealAccount = await nodemailer.createTestAccount();
      cachedTransporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: etherealAccount.user,
          pass: etherealAccount.pass
        }
      });
      console.log(`✅ Ethereal account created: ${etherealAccount.user}`);
      console.log(`🔗 View emails at: https://ethereal.email/messages`);
      return cachedTransporter;
    } catch (error) {
      console.error("❌ Failed to create Ethereal account:", error);
      return null;
    }
  }

  console.warn("⚠️  No SMTP configuration found. Set SMTP_* env vars to enable emails.");
  return null;
}

function getFromAddress(): string {
  return process.env.SMTP_FROM || process.env.SMTP_USER || etherealAccount?.user || "noreply@gehu.ac.in";
}

async function getActiveStudentEmails(): Promise<string[]> {
  const students = await Student.find({ isDisabled: { $ne: true } }).select("email");
  return students
    .map((s: any) => s.email)
    .filter((email: string | undefined) => !!email);
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  const transporter = await getTransporter();
  if (!transporter) return;

  const from = getFromAddress();
  const recipients = Array.isArray(options.to) ? options.to : [options.to];

  try {
    const info = await transporter.sendMail({
      from,
      to: recipients.join(", "),
      subject: options.subject,
      text: options.text,
      html: options.html || options.text
    });

    console.log(`✅ Email sent: "${options.subject}" to ${recipients.length} recipient(s)`);
    
    if (etherealAccount) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`🔗 Preview: ${previewUrl}`);
      }
    }
  } catch (error) {
    console.error(`❌ Failed to send email: "${options.subject}"`, error);
    throw error;
  }
}

async function sendEmailToStudents(options: { subject: string; text: string; html?: string }) {
  const transporter = await getTransporter();
  if (!transporter) return;

  const emails = await getActiveStudentEmails();
  if (emails.length === 0) {
    console.log("⚠️  No active student emails found");
    return;
  }

  console.log(`📧 Sending "${options.subject}" to ${emails.length} students...`);

  const from = getFromAddress();
  const batchSize = Number(process.env.EMAIL_BATCH_SIZE || DEFAULT_BATCH_SIZE);

  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize);
    try {
      const info = await transporter.sendMail({
        from,
        bcc: batch,
        subject: options.subject,
        text: options.text,
        html: options.html || options.text
      });

      console.log(`✅ Batch ${Math.floor(i / batchSize) + 1}: Sent to ${batch.length} students`);
      
      if (etherealAccount && i === 0) {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
          console.log(`🔗 Preview (first batch): ${previewUrl}`);
        }
      }
    } catch (error) {
      console.error(`❌ Failed to send batch ${Math.floor(i / batchSize) + 1}:`, error);
    }
  }
}

function formatEventDetails(event: any) {
  const date = event?.date ? new Date(event.date).toLocaleDateString() : "TBA";
  const time = event?.time || "TBA";
  const location = event?.location || "TBA";

  return { date, time, location };
}

export async function notifyNewEvent(event: any) {
  const { date, time, location } = formatEventDetails(event);
  const subject = `🎉 Exciting New Event: ${event.title || "Untitled Event"} - Don't Miss Out!`;
  
  const text = `
🎉 Exciting New Event Alert!

Dear Esteemed Student,

We're thrilled to announce an amazing new event that's coming your way! 

📌 Event Title: ${event.title || "Untitled Event"}
🏛️ Hosted by: ${event.clubName || "GEHU Clubs"}
📅 Date: ${date}
🕐 Time: ${time}
📍 Location: ${location}

📝 About This Event:
${event.description || "An exciting opportunity to learn, grow, and connect with fellow students!"}

Why You Should Attend:
✨ Network with passionate club members and fellow students
🚀 Gain valuable knowledge and hands-on experience
🎯 Develop new skills and expand your horizons
🏆 Build meaningful connections in the university community

This is your chance to be part of something special! Whether you're a seasoned participant or exploring for the first time, this event promises to be engaging, informative, and fun.

Mark your calendar, clear your schedule, and get ready for an unforgettable experience. We can't wait to see you there!

Questions or need more details? Reply to this email or visit our website.

Best regards,
GEHU Clubs Team
Gebra Engineering and Health University

P.S. Invite your friends! The more, the merrier! 🎊
  `;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px; }
    .content { background: white; padding: 40px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #667eea; padding-bottom: 20px; }
    .header h1 { color: #667eea; margin: 0; font-size: 28px; }
    .header p { color: #666; margin: 5px 0 0 0; }
    .event-card { background: #f8f9fa; padding: 25px; border-left: 5px solid #667eea; margin: 25px 0; border-radius: 5px; }
    .event-detail { display: flex; align-items: center; margin: 12px 0; }
    .event-detail-icon { font-size: 20px; margin-right: 10px; min-width: 30px; }
    .event-detail-text { flex: 1; }
    .event-detail-label { font-weight: bold; color: #667eea; }
    .description { background: white; padding: 20px; border-radius: 5px; border: 1px solid #e0e0e0; margin: 20px 0; }
    .benefits { margin: 25px 0; }
    .benefits h3 { color: #667eea; margin-bottom: 15px; }
    .benefit-item { padding: 10px 0; border-bottom: 1px solid #eee; }
    .benefit-item:last-child { border-bottom: none; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 50px; font-weight: bold; margin: 20px 0; font-size: 16px; }
    .footer { background: #f8f9fa; padding: 20px; border-radius: 5px; margin-top: 25px; text-align: center; font-size: 12px; color: #666; }
    .ps { font-style: italic; color: #667eea; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="content">
      <div class="header">
        <h1>🎉 Exciting New Event Alert!</h1>
        <p>Something amazing is coming your way</p>
      </div>

      <p style="font-size: 16px; margin: 0;">Dear Esteemed Student,</p>

      <p style="margin-top: 15px;">We're absolutely <strong>thrilled</strong> to announce an incredible new event that we think you'll love! This is your chance to explore something special, connect with amazing people, and create lasting memories.</p>

      <div class="event-card">
        <div class="event-detail">
          <div class="event-detail-icon">🎯</div>
          <div class="event-detail-text">
            <div class="event-detail-label">Event Title</div>
            <div>${event.title || "Untitled Event"}</div>
          </div>
        </div>

        <div class="event-detail">
          <div class="event-detail-icon">🏛️</div>
          <div class="event-detail-text">
            <div class="event-detail-label">Hosted By</div>
            <div>${event.clubName || "GEHU Clubs"}</div>
          </div>
        </div>

        <div class="event-detail">
          <div class="event-detail-icon">📅</div>
          <div class="event-detail-text">
            <div class="event-detail-label">Date</div>
            <div>${date}</div>
          </div>
        </div>

        <div class="event-detail">
          <div class="event-detail-icon">🕐</div>
          <div class="event-detail-text">
            <div class="event-detail-label">Time</div>
            <div>${time}</div>
          </div>
        </div>

        <div class="event-detail">
          <div class="event-detail-icon">📍</div>
          <div class="event-detail-text">
            <div class="event-detail-label">Location</div>
            <div>${location}</div>
          </div>
        </div>
      </div>

      <div class="description">
        <h3 style="color: #667eea; margin-top: 0;">📝 About This Event</h3>
        <p>${event.description || "Join us for an exciting opportunity to learn, grow, and connect with fellow students!"}</p>
      </div>

      <div class="benefits">
        <h3>✨ Why You Should Attend</h3>
        <div class="benefit-item">💡 <strong>Network & Connect:</strong> Meet passionate club members and fellow students who share your interests</div>
        <div class="benefit-item">🚀 <strong>Learn & Grow:</strong> Gain valuable knowledge and hands-on experience in a dynamic environment</div>
        <div class="benefit-item">🎯 <strong>Develop Skills:</strong> Build new skills that will help you succeed academically and professionally</div>
        <div class="benefit-item">🏆 <strong>Create Memories:</strong> Be part of an engaging, informative, and fun experience</div>
        <div class="benefit-item">🌟 <strong>Expand Horizons:</strong> Discover new opportunities and possibilities within our vibrant university community</div>
      </div>

      <p style="background: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107;">
        <strong>⏰ Mark Your Calendar!</strong> Don't let this opportunity pass you by. We can't wait to see you there and make this event truly special with your presence!
      </p>

      <center>
        <a href="#" class="cta-button">Learn More Details →</a>
      </center>

      <div class="footer">
        <p>Have questions? Want to know more? Feel free to reach out to us or reply to this email. We're here to help!</p>
      </div>

      <div class="ps">
        <p style="margin: 0;"><strong>P.S.</strong> Know someone who'd love this event? Share it with your friends! The more people who attend, the more amazing it becomes! 🎊</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  await sendEmailToStudents({ subject, text, html });
}

export async function notifyUpcomingEvent(event: any) {
  const { date, time, location } = formatEventDetails(event);
  const subject = `⏰ Last Chance! ${event.title || "Untitled Event"} is Coming Up Soon!`;
  
  const text = `
⏰ Event Reminder!

Dear Esteemed Student,

This is an exciting reminder that the event you've been looking forward to is happening very soon!

📌 Event Title: ${event.title || "Untitled Event"}
🏛️ Hosted by: ${event.clubName || "GEHU Clubs"}
📅 Date: ${date}
🕐 Time: ${time}
📍 Location: ${location}

📝 Quick Recap:
${event.description || "An amazing event you won't want to miss!"}

🎯 Why This Is Special:
This event has been carefully planned and organized to provide you with an enriching, engaging, and memorable experience. Whether it's learning something new, connecting with peers, or simply having fun, this event has something for everyone.

✅ What You Should Do Now:
1. Mark your calendar and set a reminder
2. Plan your travel/logistics to ensure you arrive on time
3. Invite friends who might be interested
4. Come with an open mind and enthusiasm!

Don't miss out on this fantastic opportunity. We're counting on your presence to make this event a grand success!

See you there!

Best regards,
GEHU Clubs Team
Gebra Engineering and Health University

P.S. Still undecided? Trust us, you won't regret attending! Come join us for an unforgettable experience! 🌟
  `;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius: 10px; }
    .content { background: white; padding: 40px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #f5576c; padding-bottom: 20px; }
    .header h1 { color: #f5576c; margin: 0; font-size: 28px; }
    .header p { color: #666; margin: 5px 0 0 0; }
    .urgency-banner { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; font-size: 18px; font-weight: bold; }
    .event-card { background: #f8f9fa; padding: 25px; border-left: 5px solid #f5576c; margin: 25px 0; border-radius: 5px; }
    .event-detail { display: flex; align-items: center; margin: 12px 0; }
    .event-detail-icon { font-size: 20px; margin-right: 10px; min-width: 30px; }
    .event-detail-text { flex: 1; }
    .event-detail-label { font-weight: bold; color: #f5576c; }
    .action-list { background: #fff3cd; padding: 20px; border-radius: 5px; border-left: 5px solid #ff9800; margin: 20px 0; }
    .action-list h3 { color: #f5576c; margin-top: 0; }
    .action-item { padding: 8px 0; }
    .action-item strong { color: #f5576c; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 50px; font-weight: bold; margin: 20px 0; font-size: 16px; }
    .footer { background: #f8f9fa; padding: 20px; border-radius: 5px; margin-top: 25px; text-align: center; font-size: 12px; color: #666; }
    .ps { font-style: italic; color: #f5576c; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="content">
      <div class="header">
        <h1>⏰ Event Reminder!</h1>
        <p>Something amazing is almost here</p>
      </div>

      <div class="urgency-banner">
        🎯 ${date} at ${time} - Don't Miss It!
      </div>

      <p style="font-size: 16px; margin: 0;">Dear Esteemed Student,</p>

      <p style="margin-top: 15px;">We're reaching out with some <strong>exciting news</strong> – the event you've been looking forward to is happening <strong>very soon</strong>! This is your last chance to prepare and make sure you don't miss out on an incredible experience.</p>

      <div class="event-card">
        <div class="event-detail">
          <div class="event-detail-icon">🎯</div>
          <div class="event-detail-text">
            <div class="event-detail-label">Event Title</div>
            <div>${event.title || "Untitled Event"}</div>
          </div>
        </div>

        <div class="event-detail">
          <div class="event-detail-icon">🏛️</div>
          <div class="event-detail-text">
            <div class="event-detail-label">Hosted By</div>
            <div>${event.clubName || "GEHU Clubs"}</div>
          </div>
        </div>

        <div class="event-detail">
          <div class="event-detail-icon">📅</div>
          <div class="event-detail-text">
            <div class="event-detail-label">Date</div>
            <div><strong>${date}</strong></div>
          </div>
        </div>

        <div class="event-detail">
          <div class="event-detail-icon">🕐</div>
          <div class="event-detail-text">
            <div class="event-detail-label">Time</div>
            <div><strong>${time}</strong></div>
          </div>
        </div>

        <div class="event-detail">
          <div class="event-detail-icon">📍</div>
          <div class="event-detail-text">
            <div class="event-detail-label">Location</div>
            <div><strong>${location}</strong></div>
          </div>
        </div>
      </div>

      <div style="background: #f0f8ff; padding: 20px; border-radius: 5px; border-left: 4px solid #2196F3; margin: 20px 0;">
        <h3 style="color: #f5576c; margin-top: 0;">📝 About This Event</h3>
        <p>${event.description || "Join us for an amazing opportunity to learn, grow, and connect with fellow students!"}</p>
      </div>

      <p style="font-size: 15px; line-height: 1.8;">
        <strong>🎯 Why This Event Is Special:</strong><br/>
        This event has been carefully planned and organized to provide you with an <strong>enriching, engaging, and memorable experience</strong>. Whether you're looking to learn something new, connect with like-minded peers, or simply have a great time, this event promises something for everyone!
      </p>

      <div class="action-list">
        <h3>✅ What You Should Do Right Now:</h3>
        <div class="action-item"><strong>1. Set a Reminder:</strong> Mark your calendar and set a phone reminder for the event date and time</div>
        <div class="action-item"><strong>2. Plan Ahead:</strong> Arrange your logistics, transportation, and schedule to ensure you arrive on time</div>
        <div class="action-item"><strong>3. Spread the Word:</strong> Invite friends and classmates who would benefit from attending</div>
        <div class="action-item"><strong>4. Come Ready:</strong> Bring enthusiasm, curiosity, and an open mind for the best experience!</div>
      </div>

      <p style="text-align: center; font-size: 16px; color: #f5576c; font-weight: bold;">
        ⏳ We're counting on your presence to make this event a grand success! <br/>
        See you there! 🌟
      </p>

      <div class="footer">
        <p>Questions about the event? Need more information? Feel free to reach out to us or reply to this email. We're here to help!</p>
      </div>

      <div class="ps">
        <p style="margin: 0;"><strong>P.S.</strong> Still unsure about attending? Trust us – people who attend GEHU Clubs events always say they had an amazing time! Come and be part of something special! 🚀</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  await sendEmailToStudents({ subject, text, html });
}

export async function notifyAnnouncement(announcement: any) {
  const subject = `📢 Important Announcement from GEHU: ${announcement.title || "New Announcement"}`;
  
  const text = `
📢 University Announcement

Dear Valued Member of GEHU Community,

We're excited to share an important announcement that may be of interest to you!

📌 Announcement Title: ${announcement.title || "New Announcement"}

📝 Details:
${announcement.content || "An important update from the university administration."}

We encourage you to read this announcement carefully and take any necessary action mentioned. If you have any questions or need clarification on this announcement, please don't hesitate to reach out to the appropriate department or contact us.

This message is part of our commitment to keeping you informed and engaged with important university updates.

Best regards,
GEHU Clubs Administration
Gebra Engineering and Health University

P.S. Make sure to stay tuned to our announcements for more important updates and exciting news! 🌟
  `;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px; }
    .content { background: white; padding: 40px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #667eea; padding-bottom: 20px; }
    .header h1 { color: #667eea; margin: 0; font-size: 28px; }
    .header p { color: #666; margin: 5px 0 0 0; font-size: 14px; }
    .announcement-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px; margin: 25px 0; }
    .announcement-card h2 { margin: 0 0 15px 0; font-size: 22px; }
    .announcement-content { background: #f8f9fa; padding: 25px; border-radius: 5px; margin: 20px 0; border-left: 5px solid #667eea; line-height: 1.8; }
    .importance-badge { display: inline-block; background: #fff3cd; color: #856404; padding: 10px 15px; border-radius: 20px; margin: 15px 0; font-weight: bold; }
    .action-section { background: #e3f2fd; padding: 20px; border-radius: 5px; border-left: 4px solid #2196F3; margin: 20px 0; }
    .action-section h3 { color: #667eea; margin-top: 0; }
    .footer { background: #f8f9fa; padding: 20px; border-radius: 5px; margin-top: 25px; text-align: center; font-size: 12px; color: #666; }
    .ps { font-style: italic; color: #667eea; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0; }
    .contact-info { background: white; padding: 15px; border: 1px solid #e0e0e0; border-radius: 5px; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="content">
      <div class="header">
        <h1>📢 University Announcement</h1>
        <p>Important Update from GEHU Administration</p>
      </div>

      <p style="font-size: 16px; margin: 0;">Dear Valued Member of GEHU Community,</p>

      <p style="margin-top: 15px;">We're pleased to share an <strong>important announcement</strong> that we believe will be of great interest to you. Please take a moment to read through this message carefully, as it contains information that may affect you or be relevant to your university experience.</p>

      <div class="announcement-card">
        <h2>${announcement.title || "New Announcement"}</h2>
        <p style="margin: 0; opacity: 0.95;">📌 Official Communication from GEHU Administration</p>
      </div>

      <div class="announcement-content">
        <p style="margin-top: 0;">${announcement.content || "An important update from the university administration."}</p>
      </div>

      <div class="importance-badge">
        ⭐ Please Review & Take Note
      </div>

      <div class="action-section">
        <h3>📌 What This Means for You:</h3>
        <p>We encourage you to:</p>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li><strong>Read carefully</strong> through all the details provided above</li>
          <li><strong>Take appropriate action</strong> if any steps are required on your part</li>
          <li><strong>Share with others</strong> if this announcement is relevant to them</li>
          <li><strong>Contact us</strong> if you have questions or need clarification</li>
        </ul>
      </div>

      <p style="background: #f0f8ff; padding: 15px; border-radius: 5px; border-left: 4px solid #2196F3; margin: 20px 0;">
        <strong>💡 Stay Informed:</strong> This is part of our ongoing commitment to keep you informed about important university updates, events, and opportunities. Your awareness and engagement help us build a better GEHU community!
      </p>

      <div class="contact-info">
        <p style="margin: 0 0 10px 0;"><strong>Need Help?</strong></p>
        <p style="margin: 5px 0;">If you have any questions about this announcement or need further clarification, don't hesitate to reach out to the appropriate department or reply to this email. We're here to help!</p>
      </div>

      <p style="text-align: center; font-size: 15px; color: #667eea; font-weight: bold; margin: 25px 0;">
        Thank you for being an active member of the GEHU community! 🌟
      </p>

      <div class="footer">
        <p>This is an official communication from GEHU Clubs Administration. If you believe you received this email in error, please let us know.</p>
      </div>

      <div class="ps">
        <p style="margin: 0;"><strong>P.S.</strong> Make sure to stay tuned to our official channels and announcements for more exciting updates, opportunities, and information about university events! Follow us for the latest news! 🚀</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  await sendEmailToStudents({ subject, text, html });
}

function getUpcomingWindow() {
  const now = new Date();
  const days = Number(process.env.EVENT_REMINDER_DAYS || DEFAULT_REMINDER_DAYS);
  const end = new Date(now);
  end.setDate(now.getDate() + days);
  return { now, end };
}

export async function processUpcomingEventReminders() {
  if (isEmailDisabled()) return;

  const { now, end } = getUpcomingWindow();
  const events = await Event.find({ upcomingEmailSentAt: { $exists: false } });

  for (const event of events) {
    const eventDate = event?.date ? new Date(event.date) : null;
    if (!eventDate || Number.isNaN(eventDate.getTime())) continue;
    if (eventDate >= now && eventDate <= end) {
      await notifyUpcomingEvent(event);
      await Event.findOneAndUpdate(
        { id: event.id },
        { upcomingEmailSentAt: new Date() }
      );
    }
  }
}

export function startUpcomingEventReminderScheduler() {
  if (isEmailDisabled()) return;

  const intervalHours = Number(process.env.EVENT_REMINDER_INTERVAL_HOURS || 6);
  const intervalMs = intervalHours * 60 * 60 * 1000;

  setInterval(() => {
    processUpcomingEventReminders().catch((error) => {
      console.error("Failed to send upcoming event reminders:", error);
    });
  }, intervalMs);
}
