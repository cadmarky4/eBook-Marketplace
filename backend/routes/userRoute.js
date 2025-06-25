const express = require("express");
const UserController = require("../controllers/UserController");
const { requireAuth } = require("./middlewares/permissionAuth");
const User = require("../models/User"); // Add this import
const router = express.Router();

// Register a new user
router.post("/register", UserController.registerCustomer);

// Login user
router.post("/login", UserController.login);

// Forgot password
router.post("/forgot-password", UserController.forgotPassword);

// Check device token
router.get("/validate-token", requireAuth, UserController.validateToken);

// Get user profile
router.get("/profile", requireAuth, UserController.getUserProfile);

router.post("/check", async (req, res) => {
	try {
		const { email } = req.body;
		const user = await User.findOne({ email: { $regex: new RegExp(`^${email}$`, "i") } });
		res.json({ exists: !!user });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

module.exports = router;
