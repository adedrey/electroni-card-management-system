const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth');

/*
  Agent Authentication Begins
*/
router.post('/agent/login', authController.postAgentLogin);

router.post('/agent/reset', authController.postAgentReset);

router.get('/agent/reset/:token', authController.getAgentNewpassword);

router.post('/agent/reset/:token', authController.postAgentNewPassword);

/*
  Exco Agent Authentication Begins
*/
router.post('/exco/agent/login', authController.postAgentLogin);

router.post('/exco/agent/reset', authController.postExcoAgentReset);

router.get('/exco/agent/reset/:token', authController.getExcoAgentNewpassword);

router.post('/exco/agent/reset/:token', authController.postExcoAgentNewPassword);

/*
  User Authentication Begins
*/
router.post('/user/login', authController.postUserLogin);

router.post('/user/reset', authController.postUserReset);

router.get('/user/reset/:token', authController.getUserNewpassword);

router.post('/user/reset/:token', authController.postUserNewPassword);

/*
  Admin Authentication Begins
*/

router.post('/admin/login', authController.postAdminLogin);

router.post('/admin/reset', authController.postAdminReset);

router.get('/admin/reset/:token', authController.getAdminNewpassword);

router.post('/admin/reset/newpassword', authController.postAdminNewPassword);

module.exports = router
