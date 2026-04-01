const { Router } = require('express');
const router = Router();

router.use('/auth',         require('./auth.routes'));
router.use('/users',        require('./user.routes'));
router.use('/sermons',      require('./sermon.routes'));
router.use('/events',       require('./event.routes'));
router.use('/donations',    require('./donation.routes'));
router.use('/ministries',   require('./ministry.routes'));
router.use('/visitors',     require('./visitor.routes'));
router.use('/communications', require('./comms.routes'));

module.exports = router;
