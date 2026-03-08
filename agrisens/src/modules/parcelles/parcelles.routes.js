const express    = require('express');
const router     = express.Router();
const controller = require('./parcelles.controller');
const { authenticate, authorize } = require('../../middleware/auth.middleware');

router.use(authenticate);

router.get('/ferme/:fermeId',  controller.getByFerme);
router.post('/',               controller.create);
router.get('/:id',             controller.getById);
router.put('/:id',             controller.update);
router.delete('/:id',          authorize('admin','user'), controller.remove);

module.exports = router;
