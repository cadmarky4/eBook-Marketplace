const express = require("express");
const UserController = require("../controllers/UserController");
const router = express.Router();

// Register a new user
router.post("/register", UserController.registerCustomer);

// Login user
router.post("/login", UserController.login);

// Forgot password
router.post("/forgot-password", UserController.forgotPassword);

module.exports = router;
