const { Router } = require('express');
const { listVisitors, addVisitor, sendFollowup, updateVisitor } = require('../controllers/visitor.controller');
const authenticate = require('../middleware/authenticate');
const { requireMinRole } = require('../middleware/authorize');

const router = Router();

router.use(authenticate, requireMinRole('staff'));

router.get('/',                listVisitors);
router.post('/',               addVisitor);
router.patch('/:id',           updateVisitor);
router.post('/:id/followup',   sendFollowup);

module.exports = router;
