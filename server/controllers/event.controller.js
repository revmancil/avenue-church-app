const db = require('../config/db');

// GET /api/events
async function listEvents(req, res, next) {
  try {
    const { upcoming } = req.query;
    let where = '';
    if (upcoming === 'true') where = 'WHERE event_date >= NOW()';
    const { rows } = await db.query(
      `SELECT e.*, u.first_name || ' ' || u.last_name AS created_by_name,
              (SELECT COUNT(*) FROM rsvps r WHERE r.event_id = e.id AND r.status = 'attending') AS rsvp_count
       FROM events e
       LEFT JOIN users u ON u.id = e.created_by
       ${where}
       ORDER BY event_date ASC`
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

// POST /api/events  (Staff+)
async function createEvent(req, res, next) {
  try {
    const { title, description, location, event_date, end_date, max_capacity, is_public } = req.body;
    const { rows } = await db.query(
      `INSERT INTO events (title, description, location, event_date, end_date, max_capacity, is_public, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [title, description, location, event_date, end_date, max_capacity, is_public ?? true, req.user.id]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/events/:id  (Staff+)
async function updateEvent(req, res, next) {
  try {
    const { title, description, location, event_date, end_date, max_capacity, is_public } = req.body;
    const { rows } = await db.query(
      `UPDATE events SET
         title        = COALESCE($1, title),
         description  = COALESCE($2, description),
         location     = COALESCE($3, location),
         event_date   = COALESCE($4, event_date),
         end_date     = COALESCE($5, end_date),
         max_capacity = COALESCE($6, max_capacity),
         is_public    = COALESCE($7, is_public)
       WHERE id = $8 RETURNING *`,
      [title, description, location, event_date, end_date, max_capacity, is_public, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Event not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/events/:id  (Staff+)
async function deleteEvent(req, res, next) {
  try {
    const { rowCount } = await db.query('DELETE FROM events WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Event not found' });
    res.json({ message: 'Event deleted' });
  } catch (err) {
    next(err);
  }
}

// POST /api/events/:id/rsvp  (Member+)
async function rsvpEvent(req, res, next) {
  try {
    const { status = 'attending' } = req.body;
    const { rows } = await db.query(
      `INSERT INTO rsvps (event_id, user_id, status)
       VALUES ($1, $2, $3)
       ON CONFLICT (event_id, user_id) DO UPDATE SET status = EXCLUDED.status
       RETURNING *`,
      [req.params.id, req.user.id, status]
    );
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

// GET /api/events/:id/rsvps  (Staff+)
async function listRsvps(req, res, next) {
  try {
    const { rows } = await db.query(
      `SELECT r.*, u.first_name, u.last_name, u.email, u.phone
       FROM rsvps r
       JOIN users u ON u.id = r.user_id
       WHERE r.event_id = $1
       ORDER BY u.last_name, u.first_name`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

module.exports = { listEvents, createEvent, updateEvent, deleteEvent, rsvpEvent, listRsvps };
