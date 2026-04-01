const db = require('../config/db');

const SAFE_FIELDS = 'id, email, role, first_name, last_name, phone, address, bio, avatar_url, is_active, joined_at, created_at';

// GET /api/users  (Admin only)
async function listUsers(req, res, next) {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const params = [];
    const conditions = [];

    if (role) {
      params.push(role);
      conditions.push(`role = $${params.length}::user_role`);
    }
    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(first_name ILIKE $${params.length} OR last_name ILIKE $${params.length} OR email ILIKE $${params.length})`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(limit, offset);

    const { rows } = await db.query(
      `SELECT ${SAFE_FIELDS} FROM users ${where}
       ORDER BY last_name, first_name
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const countRes = await db.query(`SELECT COUNT(*) FROM users ${where}`, params.slice(0, -2));
    res.json({ users: rows, total: parseInt(countRes.rows[0].count), page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/users/:id/role  (Admin only)
async function updateRole(req, res, next) {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const validRoles = ['admin', 'pastor', 'staff', 'member'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: `Role must be one of: ${validRoles.join(', ')}` });
    }

    const { rows } = await db.query(
      `UPDATE users SET role = $1::user_role WHERE id = $2
       RETURNING ${SAFE_FIELDS}`,
      [role, id]
    );

    if (!rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/users/:id/status  (Admin only)
async function toggleStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    const { rows } = await db.query(
      `UPDATE users SET is_active = $1 WHERE id = $2 RETURNING ${SAFE_FIELDS}`,
      [Boolean(is_active), id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

// GET /api/users/:id
async function getUser(req, res, next) {
  try {
    const { rows } = await db.query(
      `SELECT ${SAFE_FIELDS} FROM users WHERE id = $1`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/users/me  (own profile)
async function updateMe(req, res, next) {
  try {
    const { first_name, last_name, phone, address, bio } = req.body;
    const { rows } = await db.query(
      `UPDATE users SET
         first_name = COALESCE($1, first_name),
         last_name  = COALESCE($2, last_name),
         phone      = COALESCE($3, phone),
         address    = COALESCE($4, address),
         bio        = COALESCE($5, bio)
       WHERE id = $6
       RETURNING ${SAFE_FIELDS}`,
      [first_name, last_name, phone, address, bio, req.user.id]
    );
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

module.exports = { listUsers, updateRole, toggleStatus, getUser, updateMe };
