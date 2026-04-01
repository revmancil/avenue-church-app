const db = require('../config/db');

// GET /api/settings/donation  (all authenticated users — client needs provider type)
async function getDonationSettings(req, res, next) {
  try {
    const { rows } = await db.query('SELECT key, value FROM settings');
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));

    // Never expose the Stripe secret key to the client
    const safe = {
      donation_provider:      map.donation_provider      || 'disabled',
      zeffy_form_url:         map.zeffy_form_url         || '',
      stripe_publishable_key: map.stripe_publishable_key || '',
      donation_title:         map.donation_title         || 'Give to Avenue Progressive Baptist Church',
      donation_description:   map.donation_description   || '',
    };

    res.json(safe);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/settings/donation  (Admin only)
async function updateDonationSettings(req, res, next) {
  try {
    const {
      donation_provider,
      zeffy_form_url,
      stripe_publishable_key,
      stripe_secret_key,
      donation_title,
      donation_description,
    } = req.body;

    const updates = {
      donation_provider,
      zeffy_form_url,
      stripe_publishable_key,
      donation_title,
      donation_description,
    };

    // Only update secret key if a new one is provided (non-empty)
    if (stripe_secret_key && stripe_secret_key.startsWith('sk_')) {
      updates.stripe_secret_key = stripe_secret_key;
    }

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        await db.query(
          `INSERT INTO settings (key, value) VALUES ($1, $2)
           ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
          [key, value]
        );
      }
    }

    res.json({ message: 'Donation settings saved' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getDonationSettings, updateDonationSettings };
