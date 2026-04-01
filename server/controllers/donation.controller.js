const db = require('../config/db');

// GET /api/donations  (Admin only)
async function listDonations(req, res, next) {
  try {
    const { fund, from, to, user_id, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    const params = [];
    const conditions = [];

    if (fund) { params.push(fund); conditions.push(`d.fund = $${params.length}`); }
    if (from) { params.push(from); conditions.push(`d.donated_at >= $${params.length}`); }
    if (to)   { params.push(to);   conditions.push(`d.donated_at <= $${params.length}`); }
    if (user_id) { params.push(user_id); conditions.push(`d.user_id = $${params.length}`); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(limit, offset);

    const { rows } = await db.query(
      `SELECT d.*, u.first_name, u.last_name, u.email
       FROM donations d
       LEFT JOIN users u ON u.id = d.user_id
       ${where}
       ORDER BY d.donated_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const sumRes = await db.query(
      `SELECT SUM(amount) AS total FROM donations d ${where}`,
      params.slice(0, -2)
    );

    res.json({ donations: rows, total_amount: parseFloat(sumRes.rows[0].total || 0) });
  } catch (err) {
    next(err);
  }
}

// GET /api/donations/my-giving  (Member: own history)
async function myGiving(req, res, next) {
  try {
    const { rows } = await db.query(
      `SELECT id, amount, fund, method, notes, donated_at
       FROM donations WHERE user_id = $1 ORDER BY donated_at DESC`,
      [req.user.id]
    );
    const total = rows.reduce((s, r) => s + parseFloat(r.amount), 0);
    res.json({ giving: rows, total });
  } catch (err) {
    next(err);
  }
}

// POST /api/donations  (Admin/Staff record donation)
async function recordDonation(req, res, next) {
  try {
    const { user_id, amount, fund, method, notes, donated_at } = req.body;
    const { rows } = await db.query(
      `INSERT INTO donations (user_id, amount, fund, method, notes, donated_at, recorded_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [user_id || null, amount, fund || 'General', method || 'cash', notes, donated_at || new Date(), req.user.id]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
}

module.exports = { listDonations, myGiving, recordDonation };
