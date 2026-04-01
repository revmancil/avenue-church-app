const sgMail = require('../config/sendgrid');

const FROM = process.env.FROM_EMAIL || 'noreply@avenuepbc.org';
const PASTOR_NAME = process.env.PASTOR_NAME || 'Dr. Mancil Carroll III';
const CHURCH_NAME = process.env.CHURCH_NAME || 'Avenue Progressive Baptist Church';

async function sendPasswordReset(user, resetUrl) {
  const msg = {
    to: user.email,
    from: FROM,
    subject: `${CHURCH_NAME} – Password Reset`,
    html: `
      <p>Hi ${user.first_name},</p>
      <p>We received a request to reset your password for your <strong>${CHURCH_NAME}</strong> member portal account.</p>
      <p>Click the button below to reset your password. This link expires in 1 hour.</p>
      <p>
        <a href="${resetUrl}" style="background:#1d4ed8;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">
          Reset Password
        </a>
      </p>
      <p>If you did not request this, please ignore this email.</p>
      <p>In His service,<br/><strong>${CHURCH_NAME}</strong></p>
    `,
  };

  if (process.env.SENDGRID_API_KEY) {
    await sgMail.send(msg);
  } else {
    console.log('[Email Stub] Password reset to:', user.email, resetUrl);
  }
}

async function sendVisitorFollowup(visitor) {
  const msg = {
    to: visitor.email,
    from: FROM,
    subject: `Welcome to ${CHURCH_NAME}!`,
    html: `
      <p>Dear ${visitor.first_name},</p>
      <p>
        What a blessing it was to have you worship with us at <strong>${CHURCH_NAME}</strong>!
        We hope your visit was an uplifting and meaningful experience.
      </p>
      <p>
        We would love for you to continue joining us. Our services are held each Sunday
        and we have a vibrant community of believers ready to welcome you.
      </p>
      <p>
        If you have any questions or would like to learn more about our ministries, please
        don't hesitate to reach out. Our doors are always open.
      </p>
      <p>Walking with you in faith,</p>
      <p>
        <strong>${PASTOR_NAME}</strong><br/>
        Senior Pastor<br/>
        ${CHURCH_NAME}
      </p>
    `,
  };

  if (process.env.SENDGRID_API_KEY) {
    await sgMail.send(msg);
  } else {
    console.log('[Email Stub] Visitor follow-up to:', visitor.email);
  }
}

async function sendBroadcast(recipients, subject, body) {
  const messages = recipients.map((r) => ({
    to: r.email,
    from: FROM,
    subject,
    html: `<p>Dear ${r.first_name || 'Friend'},</p>${body}<p>—<strong>${CHURCH_NAME}</strong></p>`,
  }));

  if (process.env.SENDGRID_API_KEY) {
    await sgMail.send(messages);
  } else {
    console.log(`[Email Stub] Broadcast to ${recipients.length} recipients:`, subject);
  }
}

module.exports = { sendPasswordReset, sendVisitorFollowup, sendBroadcast };
