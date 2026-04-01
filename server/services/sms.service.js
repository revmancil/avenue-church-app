const twilioClient = require('../config/twilio');

const FROM = process.env.TWILIO_PHONE_NUMBER;

async function sendBroadcast(phoneNumbers, message) {
  let sent = 0;
  let failed = 0;

  for (const to of phoneNumbers) {
    try {
      if (twilioClient) {
        await twilioClient.messages.create({ from: FROM, to, body: message });
      } else {
        console.log(`[SMS Stub] To: ${to} | ${message}`);
      }
      sent++;
    } catch (err) {
      console.error(`SMS failed to ${to}:`, err.message);
      failed++;
    }
  }

  return { sent, failed };
}

async function sendSingle(to, message) {
  if (twilioClient) {
    return twilioClient.messages.create({ from: FROM, to, body: message });
  }
  console.log(`[SMS Stub] To: ${to} | ${message}`);
  return { status: 'stub' };
}

module.exports = { sendBroadcast, sendSingle };
