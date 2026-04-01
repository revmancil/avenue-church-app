const db = require('../config/db');

// GET /api/families  (Staff+)
async function listFamilies(req, res, next) {
  try {
    const { rows } = await db.query(
      `SELECT f.*,
              pc.first_name || ' ' || pc.last_name AS primary_contact_name,
              COUNT(u.id) AS member_count
       FROM families f
       LEFT JOIN users pc ON pc.id = f.primary_contact_id
       LEFT JOIN users u  ON u.family_id = f.id
       GROUP BY f.id, pc.first_name, pc.last_name
       ORDER BY f.family_name`
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

// GET /api/families/:id  (Staff+ or own family member)
async function getFamily(req, res, next) {
  try {
    const { rows: familyRows } = await db.query(
      `SELECT f.*, pc.first_name || ' ' || pc.last_name AS primary_contact_name
       FROM families f
       LEFT JOIN users pc ON pc.id = f.primary_contact_id
       WHERE f.id = $1`,
      [req.params.id]
    );

    if (!familyRows[0]) return res.status(404).json({ error: 'Family not found' });

    // Get all members of this family with their active ministries
    const { rows: members } = await db.query(
      `SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.role, u.avatar_url,
              COALESCE(
                json_agg(
                  json_build_object('id', m.id, 'name', m.name)
                ) FILTER (WHERE m.id IS NOT NULL),
                '[]'
              ) AS ministries
       FROM users u
       LEFT JOIN member_ministries mm ON mm.user_id = u.id
       LEFT JOIN ministries m         ON m.id = mm.ministry_id
       WHERE u.family_id = $1 AND u.is_active = TRUE
       GROUP BY u.id
       ORDER BY u.last_name, u.first_name`,
      [req.params.id]
    );

    res.json({ ...familyRows[0], members });
  } catch (err) {
    next(err);
  }
}

// POST /api/families  (Admin/Staff)
async function createFamily(req, res, next) {
  try {
    const { family_name, primary_contact_id, notes } = req.body;

    if (!family_name) return res.status(400).json({ error: 'Family name is required' });

    const { rows } = await db.query(
      `INSERT INTO families (family_name, primary_contact_id, notes)
       VALUES ($1, $2, $3) RETURNING *`,
      [family_name, primary_contact_id || null, notes || null]
    );

    // If primary_contact_id provided, assign their family_id
    if (primary_contact_id) {
      await db.query('UPDATE users SET family_id = $1 WHERE id = $2', [rows[0].id, primary_contact_id]);
    }

    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
}

// POST /api/families/:id/members  (Admin/Staff — add a user to a family)
async function addFamilyMember(req, res, next) {
  try {
    const { user_id } = req.body;

    if (!user_id) return res.status(400).json({ error: 'user_id is required' });

    // Verify family exists
    const { rows: familyRows } = await db.query('SELECT id FROM families WHERE id = $1', [req.params.id]);
    if (!familyRows[0]) return res.status(404).json({ error: 'Family not found' });

    const { rows } = await db.query(
      'UPDATE users SET family_id = $1 WHERE id = $2 RETURNING id, first_name, last_name, email, role',
      [req.params.id, user_id]
    );

    if (!rows[0]) return res.status(404).json({ error: 'User not found' });

    res.json({ message: 'Member added to family', user: rows[0] });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/families/:id/members/:userId  (Admin/Staff — remove user from family)
async function removeFamilyMember(req, res, next) {
  try {
    await db.query(
      'UPDATE users SET family_id = NULL WHERE id = $1 AND family_id = $2',
      [req.params.userId, req.params.id]
    );
    res.json({ message: 'Member removed from family' });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/families/:id  (Admin/Staff)
async function updateFamily(req, res, next) {
  try {
    const { family_name, primary_contact_id, notes } = req.body;
    const { rows } = await db.query(
      `UPDATE families SET
         family_name        = COALESCE($1, family_name),
         primary_contact_id = COALESCE($2, primary_contact_id),
         notes              = COALESCE($3, notes)
       WHERE id = $4 RETURNING *`,
      [family_name, primary_contact_id, notes, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Family not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

module.exports = { listFamilies, getFamily, createFamily, addFamilyMember, removeFamilyMember, updateFamily };
