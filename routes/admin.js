
const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin");
const isAdminAuth = require('../middleware/isAdminAuth');
const adminData = require('../middleware/adminData');
const file = require('../middleware/file');

router.post('/agent', [isAdminAuth, adminData], adminController.postAddAgent);
router.post('/agent/user/approve/:userId', [isAdminAuth, adminData], adminController.postUserApproval);
router.post('/agent/account', [isAdminAuth, adminData], adminController.postAgentStatus);
router.post('/profile', [isAdminAuth, adminData], adminController.postProfile);
router.post('/user/edit/:userId', [isAdminAuth, adminData], adminController.postEditUserDetails)
router.get('/agents', [isAdminAuth, adminData], adminController.getAgents);
router.get('/counts', [isAdminAuth, adminData], adminController.getUserAgentCount);
router.delete('/agent/remove/:agentId', [isAdminAuth, adminData], adminController.deleteAgent);
router.delete('/user/remove/:userId', [isAdminAuth, adminData], adminController.deleteUser);
router.post('/agents-users', [isAdminAuth, adminData], adminController.getAgentUsers);
router.get('/agent/:agentId/registered', [isAdminAuth, adminData], adminController.getAgentRegisteredAccounts);
router.post('/user/uniqueId', [isAdminAuth, adminData], adminController.getUserByUniqueId);
router.get('/user/:id', [isAdminAuth, adminData], adminController.getUserById);
router.post('/users/unit', [isAdminAuth, adminData], adminController.getUsersByUnit);

//api to standalone app
router.get('/v1/digi/66f94e9574a3d9ce/users', adminController.getUsersData);
router.post('/v1/digi/66f94e9574a3d9ce/post/newuser', adminController.postStartUserReg);
router.get('/v1/digi/66f94e9574a3d9ce/users/get/user/:id', adminController.getUserById);
router.post('/v1/digi/66f94e9574a3d9ce/finger/search', adminController.getUsersByFingerPrint);
router.get('/users/count', adminController.getUsersCount)
module.exports = router;