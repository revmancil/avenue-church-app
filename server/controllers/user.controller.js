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

// POST /api/users  (Admin only — create a new member account)
async function createUser(req, res, next) {
  try {
    const bcrypt = require('bcryptjs');
    const { first_name, last_name, email, password, phone, role } = req.body;

    if (!first_name || !last_name || !email || !password) {
      return res.status(400).json({ error: 'First name, last name, email, and password are required' });
    }

    const validRoles = ['admin', 'pastor', 'staff', 'member'];
    const assignedRole = validRoles.includes(role) ? role : 'member';

    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rowCount > 0) {
      return res.status(409).json({ error: 'An account with that email already exists' });
    }

    const password_hash = await bcrypt.hash(password, 12);

    const { rows } = await db.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone, role)
       VALUES ($1, $2, $3, $4, $5, $6::user_role)
       RETURNING ${SAFE_FIELDS}`,
      [email.toLowerCase(), password_hash, first_name, last_name, phone || null, assignedRole]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505' && err.constraint === 'users_email_unique') {
      return res.status(409).json({ error: 'An account with that email already exists' });
    }
    next(err);
  }
}

// PATCH /api/users/:id  (Admin only — edit a member's profile)
async function updateUser(req, res, next) {
  try {
    const { id } = req.params;
    const { first_name, last_name, email, phone, address, bio } = req.body;

    // Check email uniqueness if changing email
    if (email) {
      const existing = await db.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email.toLowerCase(), id]);
      if (existing.rowCount > 0) {
        return res.status(409).json({ error: 'That email is already used by another account' });
      }
    }

    const { rows } = await db.query(
      `UPDATE users SET
         first_name = COALESCE($1, first_name),
         last_name  = COALESCE($2, last_name),
         email      = COALESCE($3, email),
         phone      = COALESCE($4, phone),
         address    = COALESCE($5, address),
         bio        = COALESCE($6, bio)
       WHERE id = $7
       RETURNING ${SAFE_FIELDS}`,
      [first_name || null, last_name || null, email ? email.toLowerCase() : null, phone || null, address || null, bio || null, id]
    );

    if (!rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

module.exports = { listUsers, createUser, updateUser, updateRole, toggleStatus, getUser, updateMe };
