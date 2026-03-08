const express    = require('express');
const router     = express.Router();
const controller = require('./devices.controller');
const { authenticate, authorize } = require('../../middleware/auth.middleware');

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const db = require('../../config/db');
    const devices = await db('devices').orderBy('created_at','desc');
    res.json(devices);
  } catch(e){ next(e); }
});
router.get('/gateway/:gatewayId',   controller.getByGateway);
router.post('/',                    authorize('admin','user'), controller.create);
router.get('/:id',                  controller.getById);
router.put('/:id',                  authorize('admin','user'), controller.update);
router.patch('/:id/status',         controller.updateStatus);
router.delete('/:id',               authorize('admin','user'), controller.remove);

module.exports = router;
