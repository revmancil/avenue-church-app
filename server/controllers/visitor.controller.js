const db = require('../config/db');
const emailService = require('../services/email.service');

// GET /api/visitors  (Staff+)
async function listVisitors(req, res, next) {
  try {
    const { followup_sent, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const params = [];
    let where = '';

    if (followup_sent !== undefined) {
      params.push(followup_sent === 'true');
      where = `WHERE followup_sent = $${params.length}`;
    }

    params.push(limit, offset);
    const { rows } = await db.query(
      `SELECT * FROM visitors ${where}
       ORDER BY visit_date DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

// POST /api/visitors  (Staff+)
async function addVisitor(req, res, next) {
  try {
    const { first_name, last_name, email, phone, address, visit_date, how_heard, notes } = req.body;
    const { rows } = await db.query(
      `INSERT INTO visitors (first_name, last_name, email, phone, address, visit_date, how_heard, notes, added_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [first_name, last_name, email, phone, address, visit_date || new Date(), how_heard, notes, req.user.id]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
}

// POST /api/visitors/:id/followup  (Staff+)
async function sendFollowup(req, res, next) {
  try {
    const { rows } = await db.query('SELECT * FROM visitors WHERE id = $1', [req.params.id]);
    const visitor = rows[0];

    if (!visitor) return res.status(404).json({ error: 'Visitor not found' });
    if (!visitor.email) return res.status(400).json({ error: 'Visitor has no email address' });
    if (visitor.followup_sent) return res.status(409).json({ error: 'Follow-up already sent' });

    await emailService.sendVisitorFollowup(visitor);

    await db.query(
      'UPDATE visitors SET followup_sent = TRUE, followup_sent_at = NOW() WHERE id = $1',
      [visitor.id]
    );

    res.json({ message: `Follow-up email sent to ${visitor.email}` });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/visitors/:id
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

module.exports = { listVisitors, addVisitor, sendFollowup, updateVisitor };
