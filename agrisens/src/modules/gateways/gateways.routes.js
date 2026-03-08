const express    = require('express');
const router     = express.Router();
const controller = require('./gateways.controller');
const { authenticate, authorize } = require('../../middleware/auth.middleware');

router.use(authenticate);

router.get('/ferme/:fermeId',       controller.getByFerme);
router.post('/',                    authorize('admin','user'), controller.create);
router.get('/:id',                  controller.getById);
router.put('/:id',                  authorize('admin','user'), controller.update);
router.patch('/:id/heartbeat',      controller.heartbeat);
router.delete('/:id',               authorize('admin','user'), controller.remove);

module.exports = router;
