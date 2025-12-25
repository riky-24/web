const express = require("express");
const router = express.Router();
const loginController = require("../controllers/loginController");
const loginMiddleware = require("../middlewares/loginMiddleware");

// POST /api/login -> Tahap 1
router.post("/", loginMiddleware.validateInitiate, loginController.initiate);

// POST /api/login/verify -> Tahap 2
router.post("/verify", loginMiddleware.validateMfa, loginController.verifyMfa);

module.exports = router;
