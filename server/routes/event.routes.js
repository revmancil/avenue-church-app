const { Router } = require('express');
const { listEvents, createEvent, updateEvent, deleteEvent, rsvpEvent, listRsvps } = require('../controllers/event.controller');
const authenticate = require('../middleware/authenticate');
const { requireMinRole } = require('../middleware/authorize');

const router = Router();

router.use(authenticate);

router.get('/',              listEvents);
router.post('/',             requireMinRole('staff'), createEvent);
router.patch('/:id',         requireMinRole('staff'), updateEvent);
router.delete('/:id',        requireMinRole('staff'), deleteEvent);
router.post('/:id/rsvp',     rsvpEvent);
router.get('/:id/rsvps',     requireMinRole('staff'), listRsvps);

module.exports = router;
