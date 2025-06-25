const express = require("express");
const router = express.Router();
const PublisherController = require("../controllers/UserController");

const auth = require("./middlewares/permissionAuth");

// Publisher registration (new users)
router.post("/register/publisher", PublisherController.registerPublisher);

// Publisher upgrade (existing authenticated users)
router.post("/upgrade/publisher", auth.requireAuth, PublisherController.upgradeToPublisher);

// Get publisher profile
router.get("/profile", auth.requireAuth, PublisherController.getPublisherProfile);

// Update publisher earnings
router.post("/earnings", auth.requireAuth, PublisherController.updatePublisherEarnings);

// Process publisher payment
router.post("/payroll", auth.requireAuth, PublisherController.processPublisherPayment);

// Get specific publisher by ID (public)
router.get("/:id", PublisherController.getPublisherById);

module.exports = router;
