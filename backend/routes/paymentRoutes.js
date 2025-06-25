const express = require("express");
const PaymentController = require("../controllers/paymentController");
const { requireAuth, requireRole } = require("./middlewares/permissionAuth");
const multer = require("multer");

// Configure multer for file uploads (payment receipts)
const upload = multer({
	dest: "uploads/payment-proofs/",
	limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
	fileFilter: (req, file, cb) => {
		if (file.mimetype.startsWith("image/") || file.mimetype === "application/pdf") {
			cb(null, true);
		} else {
			cb(new Error("Only images and PDFs are allowed"));
		}
	},
});

const router = express.Router();

// Automated payment methods
router.post("/create-intent", requireAuth, PaymentController.createPaymentIntent);
router.post("/gcash", requireAuth, PaymentController.processGCashPayment);
router.post("/maya", requireAuth, PaymentController.processMayaPayment);
router.post("/confirm", requireAuth, PaymentController.confirmPayment);

// Manual payment verification
router.post("/verify/:orderId", requireAuth, upload.single("paymentProof"), PaymentController.verifyManualPayment);

// Admin routes for manual payment approval
router.get("/pending-verifications", requireAuth, requireRole, PaymentController.getPendingVerifications);
router.post("/approve/:orderId", requireAuth, requireRole, PaymentController.approveManualPayment);

// Other routes
router.get("/status/:paymentIntentId", requireAuth, PaymentController.getPaymentStatus);
router.post("/refund/request", requireAuth, PaymentController.requestRefund);
router.post("/refund/process", requireAuth, requireRole, PaymentController.processRefund);
router.post("/webhook", PaymentController.handleWebhook);

module.exports = router;
