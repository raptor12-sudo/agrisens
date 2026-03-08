const express    = require('express');
const router     = express.Router();
const controller = require('./auth.controller');
const { authenticate } = require('../../middleware/auth.middleware');

router.post('/register', controller.register);
router.post('/login',    controller.login);
router.post('/refresh',  controller.refresh);
router.post('/logout',   authenticate, controller.logout);
router.get('/me',        authenticate, controller.me);

module.exports = router;
