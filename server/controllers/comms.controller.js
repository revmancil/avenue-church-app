const db = require('../config/db');
const emailService = require('../services/email.service');
const smsService = require('../services/sms.service');

// POST /api/communications/email  (Staff+)
async function sendEmailBroadcast(req, res, next) {
  try {
    const { subject, body, audience } = req.body;
    // audience: 'all' | 'members' | 'role:staff' | custom array of user_ids

    let recipients = [];
    if (Array.isArray(audience)) {
      const { rows } = await db.query(
        'SELECT email, first_name, last_name FROM users WHERE id = ANY($1) AND is_active = TRUE',
        [audience]
      );
      recipients = rows;
    } else {
      let roleFilter = '';
      if (audience === 'members')      roleFilter = "AND role = 'member'";
      else if (audience === 'staff')   roleFilter = "AND role IN ('staff', 'admin', 'pastor')";

      const { rows } = await db.query(
        `SELECT email, first_name, last_name FROM users WHERE is_active = TRUE ${roleFilter}`
      );
      recipients = rows;
    }

    if (recipients.length === 0) {
      return res.status(400).json({ error: 'No recipients found for this audience' });
    }

    await emailService.sendBroadcast(recipients, subject, body);

    await db.query(
      `INSERT INTO comms_log (type, subject, body, audience_desc, recipient_count, sent_by)
       VALUES ('email', $1, $2, $3, $4, $5)`,
      [subject, body, JSON.stringify(audience), recipients.length, req.user.id]
    ).catch(() => {}); // log is best-effort

    res.json({ message: `Email broadcast sent to ${recipients.length} recipient(s)` });
  } catch (err) {
    next(err);
  }
}

// POST /api/communications/sms  (Staff+)
async function sendSmsBroadcast(req, res, next) {
  try {
    const { message, audience } = req.body;

    let phones = [];
    if (audience === 'all') {
      const { rows } = await db.query(
        "SELECT phone FROM users WHERE is_active = TRUE AND phone IS NOT NULL"
      );
      phones = rows.map((r) => r.phone);
    } else if (Array.isArray(audience)) {
      phones = audience;
    }

    if (phones.length === 0) {
      return res.status(400).json({ error: 'No phone numbers found' });
    }

    const result = await smsService.sendBroadcast(phones, message);

    res.json({ message: `SMS broadcast sent to ${result.sent} number(s)`, failed: result.failed });
  } catch (err) {
    next(err);
  }
}

// POST /api/communications/push  (Staff+ — stub, ready for Firebase/OneSignal)
async function sendPushBroadcast(req, res, next) {
  try {
    const { title, body, audience } = req.body;

    if (!title || !body) return res.status(400).json({ error: 'Title and body are required' });

    // Count recipients for the response
    let roleFilter = '';
    if (audience === 'members')    roleFilter = "AND role = 'member'";
    else if (audience === 'staff') roleFilter = "AND role IN ('staff', 'admin', 'pastor')";

    const { rows } = await db.query(
      `SELECT COUNT(*) AS count FROM users WHERE is_active = TRUE ${roleFilter}`
    );
    const recipientCount = parseInt(rows[0].count);

    // Push notification stub — integrate Firebase Admin SDK or OneSignal here
    // Example Firebase: await admin.messaging().sendMulticast({ tokens, notification: { title, body } })
    console.log(`[Push Stub] "${title}" → ${body} (audience: ${audience}, ~${recipientCount} users)`);

    res.json({
      message: `Push notification queued for ~${recipientCount} recipient(s)`,
      note: 'Push service not yet configured — integrate Firebase or OneSignal to activate',
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { sendEmailBroadcast, sendSmsBroadcast, sendPushBroadcast };
