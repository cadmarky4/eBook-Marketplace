const OrderService = require("../services/OrderService");

class OrderController {
	static async createOrder(req, res) {
		try {
			const { items, totalPrice, paymentMethod } = req.body;
			const userId = req.user.id;
			const order = await OrderService.createOrder(userId, items, totalPrice, paymentMethod);

			res.status(201).json({ success: true, message: "Order successful", order });
		} catch (err) {
			console.error("Order creation error:", err.message);
		}
	}

	static async verifyPayment(req, res) {
		try {
			const { orderId, paymentProof } = req.body;
			const verifiedOrder = await OrderService.verifyPayment(orderId, paymentProof);

			res.status(200).json({
				success: true,
				message: "Payment verified",
				order: verifiedOrder,
			});
		} catch (err) {
			console.error("Payment verification error:", err.message);
			res.status(400).json({
				success: false,
				message: err.message,
			});
		}
	}

	static async grantAccess(req, res) {
		try {
			const { orderId } = req.body;
			const updatedOrder = await OrderService.grantBookAccess(orderId);

			res.status(200).json({
				success: true,
				message: "Digital access granted",
				order: updatedOrder,
			});
		} catch (err) {
			console.error("Access granting error:", err.message);
			res.status(500).json({
				success: false,
				message: "Failed to grant access",
			});
		}
	}
	static async updateOrderStatus(req, res) {
		try {
			const { orderId, status } = req.body;
			const updatedOrder = await OrderService.updateOrderStatus(orderId, status);

			if (updatedOrder) {
				res.status(200).json({ success: true, message: "Order status updated", order: updatedOrder });
			} else {
				res.status(404).json({ success: false, message: "Order not found" });
			}
		} catch (err) {
			console.error("Error updating order status:", err.message);
			res.status(500).json({ success: false, message: "Internal server error" });
		}
	}

	static async getOrderById(req, res) {
		try {
			const { orderId } = req.params;
			const order = await OrderService.getOrderDetails(orderId);

			// Check if user owns this order
			if (order.customer._id.toString() !== req.user.customer._id) {
				return res.status(403).json({ error: "Unauthorized access to order" });
			}

			res.json({
				success: true,
				order,
			});
		} catch (err) {
			console.error("Error fetching order:", err.message);
			res.status(500).json({ success: false, message: "Internal server error" });
		}
	}

	static async getUserOrders(req, res) {
		try {
			const userId = req.user.id;
			const orders = await OrderService.getUserOrders(userId);

			if (orders.length > 0) {
				res.status(200).json({ success: true, orders });
			} else {
				res.status(404).json({ success: false, message: "No orders found for this user" });
			}
		} catch (err) {
			console.error("Error fetching user orders:", err.message);
			res.status(500).json({ success: false, message: "Internal server error" });
		}
	}

	static async requestRefund(req, res) {
		try {
			const { orderId, reason } = req.body;
			const refundRequest = await OrderService.requestRefund(orderId, reason);

			if (refundRequest.success) {
				res.status(200).json({ success: true, message: "Refund requested successfully" });
			} else {
				res.status(400).json({ success: false, message: refundRequest.message });
			}
		} catch (err) {
			console.error("Error requesting refund:", err.message);
			res.status(500).json({ success: false, message: "Internal server error" });
		}
	}

	static async processRefund(req, res) {
		try {
			const { orderId } = req.body;
			const refundResult = await OrderService.processRefund(orderId);

			if (refundResult.success) {
				res.status(200).json({ success: true, message: "Refund processed successfully" });
			} else {
				res.status(400).json({ success: false, message: refundResult.message });
			}
		} catch (err) {
			console.error("Error processing refund:", err.message);
			res.status(500).json({ success: false, message: "Internal server error" });
		}
	}

	static async cancelOrder(req, res) {
		try {
			const { orderId, reason } = req.body;
			const cancelledOrder = await OrderService.cancelOrder(orderId, reason);

			res.status(200).json({
				success: true,
				message: "Order cancelled successfully",
				order: cancelledOrder,
			});
		} catch (err) {
			console.error("Order cancellation error:", err.message);
			res.status(400).json({
				success: false,
				message: err.message,
			});
		}
	}

	static async getDownloadLink(req, res) {
		try {
			const { orderId, bookId } = req.params;
			const downloadLink = await OrderService.generateDownloadLink(orderId, bookId);

			res.status(200).json({
				success: true,
				downloadLink,
			});
		} catch (err) {
			console.error("Download link generation error:", err.message);
			res.status(400).json({
				success: false,
				message: err.message,
			});
		}
	}
}

module.exports = OrderController;
