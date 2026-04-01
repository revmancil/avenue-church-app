const { Router } = require('express');
const { sendEmailBroadcast, sendSmsBroadcast, sendPushBroadcast } = require('../controllers/comms.controller');
const authenticate = require('../middleware/authenticate');
const { requireMinRole } = require('../middleware/authorize');

const router = Router();

router.use(authenticate, requireMinRole('staff'));

router.post('/email', sendEmailBroadcast);
router.post('/sms',   sendSmsBroadcast);
router.post('/push',  sendPushBroadcast);

module.exports = router;
