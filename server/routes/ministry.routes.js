const { Router } = require('express');
const {
  listMinistries, getMinistry, createMinistry,
  updateMinistry, deleteMinistry,
  joinMinistry, leaveMinistry, listMinistryMembers
} = require('../controllers/ministry.controller');
const authenticate = require('../middleware/authenticate');
const { requireMinRole, authorize } = require('../middleware/authorize');

const router = Router();

router.use(authenticate);

router.get('/',             listMinistries);
router.post('/',            requireMinRole('staff'), createMinistry);
router.get('/:id',          getMinistry);
router.patch('/:id',        requireMinRole('staff'), updateMinistry);
router.delete('/:id',       authorize('admin'), deleteMinistry);
router.post('/:id/join',    joinMinistry);
router.delete('/:id/leave', leaveMinistry);
router.get('/:id/members',  requireMinRole('staff'), listMinistryMembers);

module.exports = router;
