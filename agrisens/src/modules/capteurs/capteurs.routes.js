const express    = require('express');
const router     = express.Router();
const controller = require('./capteurs.controller');
const { authenticate, authorize } = require('../../middleware/auth.middleware');

router.use(authenticate);

router.get('/device/:deviceId',    controller.getByDevice);
router.post('/',                   authorize('admin','user'), controller.create);
router.get('/:id',                 controller.getById);
router.put('/:id',                 authorize('admin','user'), controller.update);
router.post('/:id/ingest',         controller.ingest);
router.get('/:id/derniere',        controller.getDerniere);
router.get('/:id/lectures',        controller.getLectures);
router.get('/:id/stats',           controller.getStats);

module.exports = router;
