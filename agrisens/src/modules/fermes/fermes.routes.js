const express    = require('express');
const router     = express.Router();
const controller = require('./fermes.controller');
const { authenticate, authorize } = require('../../middleware/auth.middleware');

router.use(authenticate);

router.get('/',                          controller.getAll);
router.post('/',                         controller.create);
router.get('/:id',                       controller.getById);
router.put('/:id',                       controller.update);
router.delete('/:id',                    authorize('admin','user'), controller.remove);
router.get('/:id/users',                 controller.getUsers);
router.post('/:id/users',               authorize('admin','user'), controller.assignUser);
router.delete('/:id/users/:userId',     authorize('admin','user'), controller.removeUser);

module.exports = router;
