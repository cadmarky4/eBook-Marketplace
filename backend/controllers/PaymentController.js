const PaymentService = require("../services/PaymentService");
const OrderService = require("../services/OrderService");
const Order = require("../models/Order");

class PaymentController {
	// Create payment intent for credit card
	static async createPaymentIntent(req, res) {
		try {
			const { orderId, paymentMethod } = req.body;

			// Get customer ID from user (assuming user has customer relationship)
			const user = await req.user.populate("customer");
			if (!user.customer) {
				return res.status(400).json({ error: "Customer profile not found" });
			}

			const customerId = user.customer._id;

			const order = await OrderService.getOrderDetails(orderId);
			if (order.customer._id.toString() !== customerId) {
				return res.status(403).json({ error: "Unauthorized access to order" });
			}

			const paymentIntent = await PaymentService.createPaymentIntent({
				amount: order.totalPrice,
				paymentMethod,
				customerId,
				orderId,
			});

			res.json({
				success: true,
				paymentIntent,
				clientSecret: paymentIntent.attributes.client_key,
			});
		} catch (error) {
			res.status(400).json({ error: error.message });
		}
	}

	// Process GCash payment
	static async processGCashPayment(req, res) {
		try {
			const { orderId } = req.body;

			const user = await req.user.populate("customer");
			if (!user.customer) {
				return res.status(400).json({ error: "Customer profile not found" });
			}

			const customerId = user.customer._id;

			const order = await OrderService.getOrderDetails(orderId);
			if (order.customer._id.toString() !== customerId) {
				return res.status(403).json({ error: "Unauthorized access to order" });
			}

			const gcashPayment = await PaymentService.processGCash({
				amount: order.totalPrice,
				orderId,
				customerId,
			});

			res.json({
				success: true,
				redirectUrl: gcashPayment.attributes.redirect.checkout_url,
				sourceId: gcashPayment.id,
			});
		} catch (error) {
			res.status(400).json({ error: error.message });
		}
	}

	// Process Maya payment
	static async processMayaPayment(req, res) {
		try {
			const { orderId } = req.body;
			const user = await req.user.populate("customer");
			if (!user.customer) {
				return res.status(400).json({ error: "Customer profile not found" });
			}
			const customerId = user.customer._id;

			const order = await OrderService.getOrderDetails(orderId);
			if (order.customer._id.toString() !== customerId) {
				return res.status(403).json({ error: "Unauthorized access to order" });
			}

			const mayaPayment = await PaymentService.processMaya({
				amount: order.totalPrice,
				orderId,
				customerId,
			});

			res.json({
				success: true,
				redirectUrl: mayaPayment.attributes.redirect.checkout_url,
				sourceId: mayaPayment.id,
			});
		} catch (error) {
			res.status(400).json({ error: error.message });
		}
	}

	// Manual payment verification (for bank transfers, cash deposits, etc.)
	static async verifyManualPayment(req, res) {
		try {
			const { orderId } = req.params;
			const { notes } = req.body;

			const user = await req.user.populate("customer");
			if (!user.customer) {
				return res.status(400).json({ error: "Customer profile not found" });
			}
			const customerId = user.customer._id;

			const order = await OrderService.getOrderDetails(orderId);
			if (order.customer._id.toString() !== customerId.toString()) {
				return res.status(403).json({ error: "Unauthorized access to order" });
			}

			// Only allow manual verification for certain payment methods
			const manualPaymentMethods = ["bank_transfer", "cash_deposit", "over_counter"];
			if (!manualPaymentMethods.includes(order.paymentMethod)) {
				return res.status(400).json({
					error: "Manual verification not allowed for this payment method",
				});
			}

			// Handle file upload
			const paymentProofPath = req.file ? req.file.path : null;
			if (!paymentProofPath) {
				return res.status(400).json({ error: "Payment proof file is required" });
			}

			const verifiedOrder = await OrderService.verifyPayment(orderId, {
				paymentProof: paymentProofPath,
				notes,
				submittedAt: new Date(),
				submittedBy: customerId,
			});

			res.json({
				success: true,
				message: "Payment proof submitted for verification",
				order: verifiedOrder,
			});
		} catch (error) {
			res.status(400).json({ error: error.message });
		}
	}

	// Admin: Approve manual payment verification
	static async approveManualPayment(req, res) {
		try {
			const { orderId } = req.params;
			const { approved, adminNotes } = req.body;

			const order = await OrderService.getOrderDetails(orderId);
			if (order.status !== "processing") {
				return res.status(400).json({
					error: "Order is not in processing status",
				});
			}

			if (approved) {
				// Approve payment and grant access
				await OrderService.updateOrderStatus(orderId, "completed");
				await OrderService.grantBookAccess(orderId);

				res.json({
					success: true,
					message: "Payment approved and access granted",
					order: await OrderService.getOrderDetails(orderId),
				});
			} else {
				// Reject payment
				await OrderService.updateOrderStatus(orderId, "failed");
				await OrderService.cancelOrder(orderId, adminNotes || "Payment verification failed");

				res.json({
					success: true,
					message: "Payment verification rejected",
					order: await OrderService.getOrderDetails(orderId),
				});
			}
		} catch (error) {
			res.status(400).json({ error: error.message });
		}
	}

	// Get pending payment verifications (admin only)
	static async getPendingVerifications(req, res) {
		try {
			const pendingOrders = await Order.find({
				status: "processing",
				paymentMethod: { $in: ["bank_transfer", "cash_deposit", "over_counter"] },
			})
				.populate("customer")
				.populate("items.book")
				.sort({ createdAt: -1 });

			res.json({
				success: true,
				orders: pendingOrders,
			});
		} catch (error) {
			res.status(400).json({ error: error.message });
		}
	}

	// Confirm payment
	static async confirmPayment(req, res) {
		try {
			const { paymentIntentId, orderId } = req.body;

			const user = await req.user.populate("customer");
			if (!user.customer) {
				return res.status(400).json({ error: "Customer profile not found" });
			}
			const customerId = user.customer._id;

			const order = await OrderService.getOrderDetails(orderId);
			if (order.customer._id.toString() !== customerId) {
				return res.status(403).json({ error: "Unauthorized access to order" });
			}

			const result = await PaymentService.confirmPayment(paymentIntentId, orderId);

			if (result.success) {
				// Grant book access after successful payment
				await OrderService.grantBookAccess(orderId);
			}

			res.json(result);
		} catch (error) {
			res.status(400).json({ error: error.message });
		}
	}

	// Handle PayMongo webhooks
	static async handleWebhook(req, res) {
		try {
			const result = await PaymentService.handlePayMongoWebhook(req.body, req.headers);

			// If payment succeeded via webhook, grant book access
			const event = req.body.data;
			if (event.attributes.type === "payment_intent.succeeded" || event.attributes.type === "source.chargeable") {
				const orderId = event.attributes.data.attributes.metadata?.order_id;
				if (orderId) {
					await OrderService.grantBookAccess(orderId);
				}
			}

			res.json(result);
		} catch (error) {
			res.status(400).json({ error: error.message });
		}
	}

	// Get payment status
	static async getPaymentStatus(req, res) {
		try {
			const { paymentIntentId } = req.params;
			const paymentIntent = await PaymentService.getPaymentIntent(paymentIntentId);

			res.json({
				success: true,
				status: paymentIntent.attributes.status,
				paymentIntent,
			});
		} catch (error) {
			res.status(400).json({ error: error.message });
		}
	}

	// Request refund
	static async requestRefund(req, res) {
		try {
			const { orderId, reason } = req.body;
			const customerId = req.user.customer._id;

			const order = await OrderService.getOrderDetails(orderId);
			if (order.customer._id.toString() !== customerId) {
				return res.status(403).json({ error: "Unauthorized access to order" });
			}

			// Request refund in order service
			await OrderService.requestRefund(orderId);

			res.json({
				success: true,
				message: "Refund request submitted successfully",
			});
		} catch (error) {
			res.status(400).json({ error: error.message });
		}
	}

	// Process refund (admin only)
	static async processRefund(req, res) {
		try {
			const { orderId } = req.body;

			const order = await OrderService.getOrderDetails(orderId);
			if (!order.transactionId) {
				return res.status(400).json({ error: "No payment transaction found for this order" });
			}

			// Create refund via PayMongo
			const refund = await PaymentService.createRefund(order.transactionId, order.totalPrice, "requested_by_customer");

			// Process refund in order service
			await OrderService.processRefund(orderId);

			res.json({
				success: true,
				message: "Refund processed successfully",
				refund,
			});
		} catch (error) {
			res.status(400).json({ error: error.message });
		}
	}
}

module.exports = PaymentController;
