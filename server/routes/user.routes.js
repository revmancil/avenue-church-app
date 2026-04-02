const { Router } = require('express');
const { listUsers, createUser, updateUser, updateRole, toggleStatus, getUser, updateMe } = require('../controllers/user.controller');
const authenticate = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');

const router = Router();

router.use(authenticate);

router.get('/',                   authorize('admin'), listUsers);
router.post('/',                  authorize('admin'), createUser);
router.patch('/me',               updateMe);
router.get('/:id',                authorize('admin', 'pastor', 'staff'), getUser);
router.patch('/:id',              authorize('admin'), updateUser);
router.patch('/:id/role',         authorize('admin'), updateRole);
router.patch('/:id/status',       authorize('admin'), toggleStatus);

module.exports = router;
