const { Router } = require('express');
const { getDonationSettings, updateDonationSettings } = require('../controllers/settings.controller');
const authenticate = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');

const router = Router();

router.use(authenticate);

router.get('/donation',   getDonationSettings);
router.patch('/donation', authorize('admin'), updateDonationSettings);

module.exports = router;
