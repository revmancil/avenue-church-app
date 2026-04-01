const { Router } = require('express');
const {
  listDonations, getDonationAnalytics,
  myGiving, recordDonation, createStripeIntent
} = require('../controllers/donation.controller');
const authenticate = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');

const router = Router();

router.use(authenticate);

// Admin-only financial endpoints
router.get('/',          authorize('admin'), listDonations);
router.get('/analytics', authorize('admin'), getDonationAnalytics);
router.post('/',         authorize('admin'), recordDonation);

// Any authenticated member can view own giving or initiate a donation
router.get('/my-giving',              myGiving);
router.post('/stripe/create-intent',  createStripeIntent);

module.exports = router;
