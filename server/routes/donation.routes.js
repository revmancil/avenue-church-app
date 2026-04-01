const { Router } = require('express');
const { listDonations, getDonationAnalytics, myGiving, recordDonation } = require('../controllers/donation.controller');
const authenticate = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');

const router = Router();

router.use(authenticate);

// Admin-only: full donation dashboard + analytics
// Pastor and Staff are explicitly blocked from financial totals
router.get('/',           authorize('admin'), listDonations);
router.get('/analytics',  authorize('admin'), getDonationAnalytics);
router.post('/',          authorize('admin'), recordDonation);

// Any authenticated member can view their OWN giving
router.get('/my-giving',  myGiving);

module.exports = router;
