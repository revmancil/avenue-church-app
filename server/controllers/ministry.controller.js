const db = require('../config/db');

// GET /api/ministries
async function listMinistries(req, res, next) {
  try {
    const { rows } = await db.query(
      `SELECT m.*,
              u.first_name || ' ' || u.last_name AS leader_name,
              COUNT(mm.user_id) AS member_count
       FROM ministries m
       LEFT JOIN users u ON u.id = m.leader_id
       LEFT JOIN member_ministries mm ON mm.ministry_id = m.id
       GROUP BY m.id, u.first_name, u.last_name
       ORDER BY m.name`
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

// POST /api/ministries  (Admin/Staff)
async function createMinistry(req, res, next) {
  try {
    const { name, description, leader_id, meets_at } = req.body;
    const { rows } = await db.query(
      `INSERT INTO ministries (name, description, leader_id, meets_at)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [name, description, leader_id, meets_at]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'A ministry with that name already exists' });
    next(err);
  }
}

// POST /api/ministries/:id/join  (Member+)
async function joinMinistry(req, res, next) {
  try {
    await db.query(
      `INSERT INTO member_ministries (user_id, ministry_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [req.user.id, req.params.id]
    );
    res.json({ message: 'Joined ministry successfully' });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/ministries/:id/leave  (Member+)
async function leaveMinistry(req, res, next) {
  try {
    await db.query(
      'DELETE FROM member_ministries WHERE user_id = $1 AND ministry_id = $2',
      [req.user.id, req.params.id]
    );
    res.json({ message: 'Left ministry' });
  } catch (err) {
    next(err);
  }
}

// GET /api/ministries/:id/members  (Staff+)
async function listMinistryMembers(req, res, next) {
  try {
    const { rows } = await db.query(
      `SELECT u.id, u.first_name, u.last_name, u.email, u.phone, mm.joined_at
       FROM member_ministries mm
       JOIN users u ON u.id = mm.user_id
       WHERE mm.ministry_id = $1
       ORDER BY u.last_name, u.first_name`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

module.exports = { listMinistries, createMinistry, joinMinistry, leaveMinistry, listMinistryMembers };
