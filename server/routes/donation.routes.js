const { Router } = require('express');
const { listDonations, myGiving, recordDonation } = require('../controllers/donation.controller');
const authenticate = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');

const router = Router();

router.use(authenticate);

// Admin-only donation dashboard
router.get('/',         authorize('admin'), listDonations);
router.post('/',        authorize('admin', 'staff'), recordDonation);

// Member can view own giving
router.get('/my-giving', myGiving);

module.exports = router;
