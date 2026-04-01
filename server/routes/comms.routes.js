const { Router } = require('express');
const { sendEmailBroadcast, sendSmsBroadcast } = require('../controllers/comms.controller');
const authenticate = require('../middleware/authenticate');
const { requireMinRole } = require('../middleware/authorize');

const router = Router();

router.use(authenticate, requireMinRole('staff'));

router.post('/email', sendEmailBroadcast);
router.post('/sms',   sendSmsBroadcast);

module.exports = router;
