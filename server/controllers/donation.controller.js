const db = require('../config/db');

// GET /api/donations  (Admin only)
async function listDonations(req, res, next) {
  try {
    const { fund, from, to, user_id, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    const params = [];
    const conditions = [];

    if (fund)    { params.push(fund);    conditions.push(`d.fund = $${params.length}`); }
    if (from)    { params.push(from);    conditions.push(`d.donated_at >= $${params.length}`); }
    if (to)      { params.push(to);      conditions.push(`d.donated_at <= $${params.length}`); }
    if (user_id) { params.push(user_id); conditions.push(`d.user_id = $${params.length}`); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(limit, offset);

    const { rows } = await db.query(
      `SELECT d.*,
              u.first_name, u.last_name, u.email, u.address, u.phone,
              COALESCE(u.first_name || ' ' || u.last_name, d.donor_name) AS display_name
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

// GET /api/donations/analytics  (Admin only)
// Returns: monthly totals, yearly totals, average per donor, recent donations
async function getDonationAnalytics(req, res, next) {
  try {
    const currentYear = new Date().getFullYear();

    // Monthly totals for current year
    const { rows: monthly } = await db.query(
      `SELECT
         TO_CHAR(DATE_TRUNC('month', donated_at), 'Mon') AS month,
         EXTRACT(MONTH FROM donated_at)                  AS month_num,
         SUM(amount)                                     AS total,
         COUNT(*)                                        AS count
       FROM donations
       WHERE EXTRACT(YEAR FROM donated_at) = $1
       GROUP BY DATE_TRUNC('month', donated_at), EXTRACT(MONTH FROM donated_at)
       ORDER BY month_num`,
      [currentYear]
    );

    // Yearly totals (last 3 years)
    const { rows: yearly } = await db.query(
      `SELECT
         EXTRACT(YEAR FROM donated_at) AS year,
         SUM(amount)                   AS total,
         COUNT(*)                      AS count,
         COUNT(DISTINCT user_id)       AS donor_count
       FROM donations
       WHERE EXTRACT(YEAR FROM donated_at) >= $1
       GROUP BY EXTRACT(YEAR FROM donated_at)
       ORDER BY year DESC`,
      [currentYear - 2]
    );

    // Average donation per donor (all time)
    const { rows: avgRows } = await db.query(
      `SELECT
         ROUND(SUM(amount) / NULLIF(COUNT(DISTINCT user_id), 0), 2) AS avg_per_donor,
         ROUND(AVG(amount), 2)                                       AS avg_per_gift,
         COUNT(DISTINCT user_id)                                     AS total_donors,
         COUNT(*)                                                    AS total_gifts
       FROM donations`
    );

    // Recent 10 donations
    const { rows: recent } = await db.query(
      `SELECT d.id, d.amount, d.fund, d.method, d.donated_at,
              u.first_name, u.last_name, d.donor_name,
              COALESCE(u.first_name || ' ' || u.last_name, d.donor_name) AS display_name
       FROM donations d
       LEFT JOIN users u ON u.id = d.user_id
       ORDER BY d.donated_at DESC
       LIMIT 10`
    );

    // Fund breakdown
    const { rows: byFund } = await db.query(
      `SELECT fund, SUM(amount) AS total, COUNT(*) AS count
       FROM donations
       GROUP BY fund
       ORDER BY total DESC`
    );

    res.json({
      monthly,
      yearly,
      summary: avgRows[0],
      recent,
      by_fund: byFund,
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/donations/my-giving  (Member: own history only)
async function myGiving(req, res, next) {
  try {
    const { rows } = await db.query(
      `SELECT id, amount, fund, method, notes, donated_at
       FROM donations WHERE user_id = $1 ORDER BY donated_at DESC`,
      [req.user.id]
    );

    const total = rows.reduce((s, r) => s + parseFloat(r.amount), 0);

    // YTD
    const ytd = rows
      .filter((r) => new Date(r.donated_at).getFullYear() === new Date().getFullYear())
      .reduce((s, r) => s + parseFloat(r.amount), 0);

    // Monthly breakdown for current year
    const monthlyMap = {};
    rows
      .filter((r) => new Date(r.donated_at).getFullYear() === new Date().getFullYear())
      .forEach((r) => {
        const month = new Date(r.donated_at).toLocaleString('default', { month: 'short' });
        monthlyMap[month] = (monthlyMap[month] || 0) + parseFloat(r.amount);
      });

    res.json({ giving: rows, total, ytd, monthly: monthlyMap });
  } catch (err) {
    next(err);
  }
}

// POST /api/donations  (Admin only — financial integrity)
async function recordDonation(req, res, next) {
  try {
    const { user_id, donor_name, amount, fund, method, notes, donated_at } = req.body;
    const { rows } = await db.query(
      `INSERT INTO donations (user_id, donor_name, amount, fund, method, notes, donated_at, recorded_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [
        user_id   || null,
        donor_name && !user_id ? donor_name.trim() : null,
        amount,
        fund      || 'General',
        method    || 'cash',
        notes     || null,
        donated_at || new Date(),
        req.user.id,
      ]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
}

// POST /api/donations/stripe/create-intent  (any authenticated user)
async function createStripeIntent(req, res, next) {
  try {
    const { amount, fund = 'General', donor_name, donor_email } = req.body;

    if (!amount || amount < 1) return res.status(400).json({ error: 'Minimum donation is $1.00' });

    // Fetch Stripe secret key from settings
    const { rows } = await db.query(
      "SELECT value FROM settings WHERE key = 'stripe_secret_key'"
    );
    const secretKey = rows[0]?.value;
    if (!secretKey || !secretKey.startsWith('sk_')) {
      return res.status(503).json({ error: 'Stripe is not configured. Please contact the administrator.' });
    }

    const stripe = require('stripe')(secretKey);

    const intent = await stripe.paymentIntents.create({
      amount: Math.round(parseFloat(amount) * 100), // convert to cents
      currency: 'usd',
      metadata: {
        fund,
        donor_name:  donor_name  || '',
        donor_email: donor_email || '',
        user_id:     req.user.id,
        church:      'Avenue Progressive Baptist Church',
      },
    });

    res.json({ clientSecret: intent.client_secret });
  } catch (err) {
    next(err);
  }
}

module.exports = { listDonations, getDonationAnalytics, myGiving, recordDonation, createStripeIntent };
