const express = require("express");
const router = express.Router();
const userController = require("../controllers/users");
const userData = require('../middleware/userData');
const isUserAuth = require('../middleware/isUserAuth');
const file = require('../middleware/file');

router.get('/profile', [isUserAuth, userData], userController.getProfile);
router.post('/profile', [isUserAuth, userData], userController.postProfile);

module.exports = router;