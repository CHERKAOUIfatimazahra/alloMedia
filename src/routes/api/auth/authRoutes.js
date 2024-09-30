const express = require("express");
const router = express.Router();
const authController = require("../../../controllers/authController");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/verify-otp", authController.verifyOTP);
router.get("/verify/:id", authController.verifyEmail); 
router.post("/request-password-reset", authController.forgotPassword);
router.post("/reset-password/:token", authController.resetPassword); 

module.exports = router;