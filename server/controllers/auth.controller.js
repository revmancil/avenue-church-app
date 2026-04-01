const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../config/db');
const emailService = require('../services/email.service');

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// POST /api/auth/signup
async function signup(req, res, next) {
  try {
    const { email, password, first_name, last_name, phone } = req.body;

    if (!email || !password || !first_name || !last_name) {
      return res.status(400).json({ error: 'Email, password, first name, and last name are required' });
    }

    // Enforce unique email — DB constraint will also catch this but we give a friendlier message
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rowCount > 0) {
      return res.status(409).json({ error: 'An account with that email already exists' });
    }

    const password_hash = await bcrypt.hash(password, 12);

    const { rows } = await db.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, role, first_name, last_name`,
      [email.toLowerCase(), password_hash, first_name, last_name, phone || null]
    );

    const user = rows[0];
    const token = signToken(user);

    res.status(201).json({ token, user });
  } catch (err) {
    // Catch DB-level unique violation (code 23505)
    if (err.code === '23505' && err.constraint === 'users_email_unique') {
      return res.status(409).json({ error: 'An account with that email already exists' });
    }
    next(err);
  }
}

// POST /api/auth/login
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { rows } = await db.query(
      'SELECT id, email, role, first_name, last_name, password_hash, is_active FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    const user = rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!user.is_active) {
      return res.status(403).json({ error: 'Account is deactivated. Contact an administrator.' });
    }

    const token = signToken(user);
    const { password_hash, ...safeUser } = user;

    res.json({ token, user: safeUser });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/forgot-password
async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;

    if (!email) return res.status(400).json({ error: 'Email is required' });

    const { rows } = await db.query(
      'SELECT id, first_name, email FROM users WHERE email = $1 AND is_active = TRUE',
      [email.toLowerCase()]
    );

    // Always respond 200 to prevent email enumeration
    res.json({ message: 'If that email exists, a reset link has been sent.' });

    if (rows.length === 0) return;

    const user = rows[0];
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + (parseInt(process.env.RESET_TOKEN_EXPIRES_MS) || 3600000));

    await db.query(
      `INSERT INTO password_resets (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, tokenHash, expiresAt]
    );

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${rawToken}`;
    await emailService.sendPasswordReset(user, resetUrl);
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/reset-password/:token
async function resetPassword(req, res, next) {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const { rows } = await db.query(
      `SELECT pr.id, pr.user_id FROM password_resets pr
       WHERE pr.token_hash = $1
         AND pr.used = FALSE
         AND pr.expires_at > NOW()`,
      [tokenHash]
    );

    if (rows.length === 0) {
      return res.status(400).json({ error: 'Reset link is invalid or has expired' });
    }

    const { id: resetId, user_id } = rows[0];
    const password_hash = await bcrypt.hash(password, 12);

    await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [password_hash, user_id]);
    await db.query('UPDATE password_resets SET used = TRUE WHERE id = $1', [resetId]);

    res.json({ message: 'Password updated successfully. You can now log in.' });
  } catch (err) {
    next(err);
  }
}

// GET /api/auth/me
async function getMe(req, res, next) {
  try {
    const { rows } = await db.query(
      `SELECT id, email, role, first_name, last_name, phone, address, bio, avatar_url, joined_at, created_at
       FROM users WHERE id = $1`,
      [req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

module.exports = { signup, login, forgotPassword, resetPassword, getMe };
