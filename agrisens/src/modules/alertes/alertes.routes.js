const express    = require('express');
const router     = express.Router();
const controller = require('./alertes.controller');
const { authenticate, authorize } = require('../../middleware/auth.middleware');

router.use(authenticate);

// Seuils
router.post('/seuils',                     controller.createSeuil);
router.get('/seuils/capteur/:capteurId',   controller.getSeuils);
router.put('/seuils/:id',                  controller.updateSeuil);
router.delete('/seuils/:id',               authorize('admin','fermier'), controller.deleteSeuil);

// Alertes
router.get('/',              controller.getAlertes);
router.get('/stats',         controller.getStats);
router.get('/:id',           controller.getAlerteById);
router.patch('/:id/acquitter', controller.acquitter);
router.patch('/:id/resoudre',  controller.resoudre);

module.exports = router;
