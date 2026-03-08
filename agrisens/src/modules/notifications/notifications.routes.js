const express = require('express');
const router  = express.Router();
const { authenticate } = require('../../middleware/auth.middleware');
router.use(authenticate);
router.get('/', (req, res) => res.json({ message: 'TODO – notifications' }));
module.exports = router;
