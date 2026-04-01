const db = require('../config/db');

// GET /api/sermons
async function listSermons(req, res, next) {
  try {
    const { series_id, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const params = [];
    let where = '';

    if (series_id) {
      params.push(series_id);
      where = `WHERE s.series_id = $${params.length}`;
    }

    params.push(limit, offset);
    const { rows } = await db.query(
      `SELECT s.*, ss.title AS series_title
       FROM sermons s
       LEFT JOIN sermon_series ss ON ss.id = s.series_id
       ${where}
       ORDER BY s.sermon_date DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

// POST /api/sermons  (Pastor+)
async function createSermon(req, res, next) {
  try {
    const { series_id, title, scripture, notes, audio_url, video_url, sermon_date, preacher } = req.body;
    const { rows } = await db.query(
      `INSERT INTO sermons (series_id, title, scripture, notes, audio_url, video_url, sermon_date, preacher, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [series_id || null, title, scripture, notes, audio_url, video_url, sermon_date, preacher || 'Dr. Mancil Carroll III', req.user.id]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
}

// GET /api/sermons/series
async function listSeries(req, res, next) {
  try {
    const { rows } = await db.query(
      'SELECT * FROM sermon_series ORDER BY start_date DESC'
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

// POST /api/sermons/series  (Pastor+)
async function createSeries(req, res, next) {
  try {
    const { title, description, cover_url, start_date, end_date } = req.body;
    const { rows } = await db.query(
      `INSERT INTO sermon_series (title, description, cover_url, start_date, end_date, created_by)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [title, description, cover_url, start_date, end_date, req.user.id]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/sermons/:id  (Pastor+)
async function updateSermon(req, res, next) {
  try {
    const { title, scripture, notes, audio_url, video_url, sermon_date, preacher } = req.body;
    const { rows } = await db.query(
      `UPDATE sermons SET
         title       = COALESCE($1, title),
         scripture   = COALESCE($2, scripture),
         notes       = COALESCE($3, notes),
         audio_url   = COALESCE($4, audio_url),
         video_url   = COALESCE($5, video_url),
         sermon_date = COALESCE($6, sermon_date),
         preacher    = COALESCE($7, preacher)
       WHERE id = $8 RETURNING *`,
      [title, scripture, notes, audio_url, video_url, sermon_date, preacher, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Sermon not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

module.exports = { listSermons, createSermon, listSeries, createSeries, updateSermon };
