const express = require("express");
const router = express.Router();
const agentController = require("../controllers/agent");
const agentData = require("../middleware/agentData");
const isAgentAuth = require("../middleware/isAgentAuth");
const excoAgentData = require("../middleware/excoAgentData");
const isExcoAgentAuth = require("../middleware/isExcoAgentAuth");
const file = require('../middleware/file');

router.post('/user/:fingerId', [isAgentAuth, agentData], agentController.postUpdateUser);
router.get('/user', [isAgentAuth, agentData], agentController.getUsers);
router.get('/counts', [isAgentAuth, agentData], agentController.getUserCount);
router.get('/profile', [isAgentAuth, agentData], agentController.getProfile);
router.post('/profile', [isAgentAuth, agentData], agentController.postProfile);
router.post('/password/change', [isAgentAuth, agentData], agentController.postChangePassword);
router.get('/user/finger/:userFingerId', [isAgentAuth, agentData], agentController.getUserByFingerId)


// Exco Router
router.get('/exco/profile', [isExcoAgentAuth, excoAgentData], agentController.getExcoProfile);
router.post('/exco/profile', [isExcoAgentAuth, excoAgentData], agentController.postExcoProfile);
router.get('/exco/users', [isExcoAgentAuth, excoAgentData], agentController.getExcoUsersByBranch);
router.get('/exco-agents', [isExcoAgentAuth, excoAgentData], agentController.getAgentsByExco);
router.get('/exco/:agentId/registered', [isExcoAgentAuth, excoAgentData], agentController.getAgentRegisteredAccounts);
router.post('/exco/user/uniqueId', [isExcoAgentAuth, excoAgentData], agentController.getUserByUniqueId);
module.exports = router;