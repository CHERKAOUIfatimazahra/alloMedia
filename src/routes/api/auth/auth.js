const express = require("express");
const router = express.Router();
const authController = require("../../../controllers/authController");

// register route
router.post("/register", authController.register);


