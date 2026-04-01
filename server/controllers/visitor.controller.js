const db = require('../config/db');
const emailService = require('../services/email.service');

// Valid status transitions for the visitor funnel
const STATUS_TRANSITIONS = {
  new:        ['contacted', 'inactive'],
  contacted:  ['follow_up', 'converted', 'inactive'],
  follow_up:  ['converted', 'contacted', 'inactive'],
  converted:  ['inactive'],
  inactive:   ['new'],
};

const VALID_STATUSES = Object.keys(STATUS_TRANSITIONS);

// GET /api/visitors  (Staff+)
async function listVisitors(req, res, next) {
  try {
    const { followup_sent, status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const params = [];
    const conditions = [];

    if (followup_sent !== undefined) {
      params.push(followup_sent === 'true');
      conditions.push(`followup_sent = $${params.length}`);
    }
    if (status) {
      params.push(status);
      conditions.push(`status = $${params.length}::visitor_status`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(limit, offset);

    const { rows } = await db.query(
      `SELECT * FROM visitors ${where}
       ORDER BY visit_date DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    // Return counts per status for the funnel summary
    const { rows: funnelCounts } = await db.query(
      `SELECT status, COUNT(*) AS count FROM visitors GROUP BY status`
    );

    res.json({ visitors: rows, funnel: funnelCounts });
  } catch (err) {
    next(err);
  }
}

// POST /api/visitors  (Staff+)
async function addVisitor(req, res, next) {
  try {
    const { first_name, last_name, email, phone, address, visit_date, how_heard, notes } = req.body;
    const { rows } = await db.query(
      `INSERT INTO visitors (first_name, last_name, email, phone, address, visit_date, how_heard, notes, added_by, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'new') RETURNING *`,
      [first_name, last_name, email, phone, address, visit_date || new Date(), how_heard, notes, req.user.id]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/visitors/:id/status  (Staff+ — advance funnel stage)
async function updateStatus(req, res, next) {
  try {
    const { status } = req.body;

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
      });
    }

    const { rows } = await db.query('SELECT status FROM visitors WHERE id = $1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Visitor not found' });

    const currentStatus = rows[0].status;
    const allowed = STATUS_TRANSITIONS[currentStatus] || [];

    if (!allowed.includes(status)) {
      return res.status(422).json({
        error: `Cannot transition from '${currentStatus}' to '${status}'. Allowed: ${allowed.join(', ')}`,
      });
    }

    const { rows: updated } = await db.query(
      `UPDATE visitors SET status = $1::visitor_status WHERE id = $2 RETURNING *`,
      [status, req.params.id]
    );

    res.json(updated[0]);
  } catch (err) {
    next(err);
  }
}

// POST /api/visitors/:id/followup  (Staff+)
async function sendFollowup(req, res, next) {
  try {
    const { rows } = await db.query('SELECT * FROM visitors WHERE id = $1', [req.params.id]);
    const visitor = rows[0];

    if (!visitor)        return res.status(404).json({ error: 'Visitor not found' });
    if (!visitor.email)  return res.status(400).json({ error: 'Visitor has no email address' });
    if (visitor.followup_sent) return res.status(409).json({ error: 'Follow-up already sent' });

    await emailService.sendVisitorFollowup(visitor);

    // Send follow-up → auto-advance status to 'contacted' if still 'new'
    const newStatus = visitor.status === 'new' ? 'contacted' : visitor.status;

    await db.query(
      `UPDATE visitors SET followup_sent = TRUE, followup_sent_at = NOW(), status = $1::visitor_status
       WHERE id = $2`,
      [newStatus, visitor.id]
    );

    res.json({ message: `Follow-up email sent to ${visitor.email}`, new_status: newStatus });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/visitors/:id  (Staff+)
async function updateVisitor(req, res, next) {
  try {
    const { first_name, last_name, email, phone, notes } = req.body;
    const { rows } = await db.query(
      `UPDATE visitors SET
         first_name = COALESCE($1, first_name),
         last_name  = COALESCE($2, last_name),
         email      = COALESCE($3, email),
         phone      = COALESCE($4, phone),
         notes      = COALESCE($5, notes)
       WHERE id = $6 RETURNING *`,
      [first_name, last_name, email, phone, notes, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Visitor not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

module.exports = { listVisitors, addVisitor, updateStatus, sendFollowup, updateVisitor };
