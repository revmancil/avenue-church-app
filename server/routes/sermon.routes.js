const { Router } = require('express');
const { listSermons, createSermon, listSeries, createSeries, updateSermon } = require('../controllers/sermon.controller');
const authenticate = require('../middleware/authenticate');
const { requireMinRole } = require('../middleware/authorize');

const router = Router();

router.use(authenticate);

router.get('/series',       listSeries);
router.post('/series',      requireMinRole('pastor'), createSeries);
router.get('/',             listSermons);
router.post('/',            requireMinRole('pastor'), createSermon);
router.patch('/:id',        requireMinRole('pastor'), updateSermon);

module.exports = router;
