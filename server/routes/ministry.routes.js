const { Router } = require('express');
const { listMinistries, createMinistry, joinMinistry, leaveMinistry, listMinistryMembers } = require('../controllers/ministry.controller');
const authenticate = require('../middleware/authenticate');
const { requireMinRole } = require('../middleware/authorize');

const router = Router();

router.use(authenticate);

router.get('/',                listMinistries);
router.post('/',               requireMinRole('staff'), createMinistry);
router.post('/:id/join',       joinMinistry);
router.delete('/:id/leave',    leaveMinistry);
router.get('/:id/members',     requireMinRole('staff'), listMinistryMembers);

module.exports = router;
