const express    = require('express');
const router     = express.Router();
const controller = require('./logs.controller');
const { authenticate, authorize } = require('../../middleware/auth.middleware');

router.use(authenticate);
router.use(authorize('admin'));

router.get('/',          controller.getLogs);
router.get('/stats',     controller.getStats);
router.get('/services',  controller.getServices);
router.post('/purge',    controller.purge);

module.exports = router;
