const { Router } = require('express');
const {
  listFamilies, getFamily, createFamily,
  addFamilyMember, removeFamilyMember, updateFamily
} = require('../controllers/family.controller');
const authenticate = require('../middleware/authenticate');
const { requireMinRole } = require('../middleware/authorize');

const router = Router();

router.use(authenticate);

router.get('/',                              requireMinRole('staff'), listFamilies);
router.post('/',                             requireMinRole('staff'), createFamily);
router.get('/:id',                           requireMinRole('staff'), getFamily);
router.patch('/:id',                         requireMinRole('staff'), updateFamily);
router.post('/:id/members',                  requireMinRole('staff'), addFamilyMember);
router.delete('/:id/members/:userId',        requireMinRole('staff'), removeFamilyMember);

module.exports = router;
