const nodemailer = require('nodemailer');
require('dotenv').config();

function createTransporter() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    console.warn('[EmailService] SMTP_USER or SMTP_PASS not set in .env. Will run in mock/preview mode.');
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '465', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: user,
      pass: pass
    }
  });
}

/**
 * Builds HTML table email containing Top 50 jobs with direct link, package, and HR contact emails
 */
function buildEmailTemplate(role, jobs, userName) {
  const tableRows = jobs.map((job, idx) => {
    const hrEmailsHtml = (job.hrEmails || [])
      .map(email => `<a href="mailto:${email}" style="color: #2563eb; text-decoration: none;">${email}</a>`)
      .join('<br>') || '<span style="color: #9ca3af;">Not available</span>';

    return `
      <tr style="border-bottom: 1px solid #e5e7eb; ${idx % 2 === 0 ? 'background-color: #f9fafb;' : ''}">
        <td style="padding: 10px 12px; font-weight: bold; color: #4b5563; text-align: center;">${idx + 1}</td>
        <td style="padding: 10px 12px;">
          <strong style="color: #111827; font-size: 14px;">${job.title}</strong><br>
          <span style="color: #6b7280; font-size: 12px;">Reqs: ${job.requirements}</span>
        </td>
        <td style="padding: 10px 12px; font-weight: 600; color: #1f2937;">${job.company}</td>
        <td style="padding: 10px 12px; color: #059669; font-weight: bold; font-size: 13px;">${job.salary}</td>
        <td style="padding: 10px 12px; color: #4b5563; font-size: 13px;">${job.location}</td>
        <td style="padding: 10px 12px; text-align: center;">
          <a href="${job.applyUrl}" target="_blank" style="background-color: #2563eb; color: #ffffff; padding: 6px 12px; text-decoration: none; border-radius: 4px; font-size: 12px; font-weight: bold; display: inline-block;">
            Apply Direct ↗
          </a>
        </td>
        <td style="padding: 10px 12px; font-size: 12px; line-height: 1.4;">${hrEmailsHtml}</td>
      </tr>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 20px; }
        .container { max-width: 1050px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        .header { background: linear-gradient(135deg, #1e3a8a, #3b82f6); color: #ffffff; padding: 24px; text-align: left; }
        .content { padding: 20px; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th { background: #f3f4f6; color: #374151; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #e5e7eb; }
        .badge { display: inline-block; padding: 4px 8px; border-radius: 9999px; font-size: 12px; font-weight: bold; background: #dbeafe; color: #1e40af; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2 style="margin: 0; font-size: 24px;">🎯 Top 50 Relevant Jobs: ${role}</h2>
          <p style="margin: 8px 0 0; opacity: 0.9; font-size: 14px;">
            Good morning ${userName || 'Job Seeker'}! Here is your curated list of verified daily job postings and direct HR contacts.
          </p>
        </div>
        <div class="content">
          <p style="color: #4b5563; font-size: 14px; margin-bottom: 16px;">
            Found <strong>${jobs.length}</strong> matching roles. All openings feature verified application links and prospective hiring manager/recruiter contact details.
          </p>
          <div style="overflow-x: auto;">
            <table>
              <thead>
                <tr>
                  <th style="width: 40px; text-align: center;">#</th>
                  <th>Job Title & Reqs</th>
                  <th>Company</th>
                  <th>Package / Salary</th>
                  <th>Location</th>
                  <th style="text-align: center;">Apply Direct</th>
                  <th>HR / Recruiter Email</th>
                </tr>
              </thead>
              <tbody>
                ${tableRows}
              </tbody>
            </table>
          </div>
          <div style="margin-top: 24px; padding: 12px; background: #f8fafc; border-radius: 6px; font-size: 12px; color: #64748b; text-align: center;">
            Sent automatically every morning @ 10:00 AM by your Personal Job Finder Bot. Zero manual work required.
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Sends the curated list to the user's email
 */
async function sendJobReportEmail(userEmail, userName, role, jobs) {
  const transporter = createTransporter();
  const subject = `Top 50 relevant job ${role}`;
  const htmlContent = buildEmailTemplate(role, jobs, userName);

  if (!transporter) {
    console.log(`[EmailService - DRY RUN] Email would be sent to: ${userEmail}`);
    console.log(`[EmailService - DRY RUN] Subject: "${subject}"`);
    console.log(`[EmailService - DRY RUN] Total Jobs included: ${jobs.length}`);
    return { success: true, dryRun: true, message: 'SMTP credentials not configured in .env yet. Mock email generated.' };
  }

  const mailOptions = {
    from: `"Daily Job Finder" <${process.env.SMTP_USER}>`,
    to: userEmail,
    subject: subject,
    html: htmlContent
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`[EmailService] Email sent successfully to ${userEmail}! Message ID: ${info.messageId}`);
  return { success: true, messageId: info.messageId };
}

module.exports = {
  sendJobReportEmail,
  buildEmailTemplate
};
