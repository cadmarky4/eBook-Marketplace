const Order = require("../models/Order");
const Book = require("../models/Book");
const Cart = require("../models/Cart");
const User = require("../models/User");
const Customer = require("../models/Customer");

class OrderService {
	static async createOrder(customerId, items, totalPrice, paymentMethod) {
		const customer = await Customer.findById(customerId);
		if (!customer) throw new Error("Customer not found");

		const cart = await Cart.findOne({ customer: customerId });
		if (!cart || cart.items.length === 0) throw new Error("Cart is empty");

		const latestOrder = await Order.findOne().sort({ createdAt: -1 });
		let counter = 1;
		if (latestOrder && latestOrder.transactionId) {
			const matches = latestOrder.transactionId.match(/TXN-(\d+)/);
			if (matches && matches[1]) {
				counter = parseInt(matches[1], 10) + 1;
			}
		}
		const transactionId = `TXN-${counter.toString().padStart(8, "0")}`;

		const newOrder = await Order.create({
			transactionId,
			customer: customerId,
			items: cart.items,
			totalPrice,
			paymentMethod,
			status: "pending",
		});

		// Clear cart after order
		cart.items = [];
		await cart.save();

		customer.purchaseHistory.push({ orderId: newOrder._id, purchaseDate: new Date(), total: totalPrice, itemCount: items.length });
		await customer.save();

		return newOrder;
	}

	static async verifyPayment(orderId, paymentProof) {
		const order = await Order.findById(orderId);
		if (!order) throw new Error("Order not found");

		if (order.status !== "pending") {
			throw new Error("Order is not in pending status");
		}

		// Store payment proof for manual verification
		order.paymentProof = {
			...paymentProof,
			status: "submitted",
			submittedAt: new Date(),
		};

		// Move to processing status for admin review
		order.status = "processing";
		await order.save();

		return order;
	}

	static async grantBookAccess(orderId) {
		const order = await Order.findById(orderId);
		if (!order) throw new Error("Order not found");

		if (order.status !== "completed") {
			throw new Error("Cannot grant access: payment not completed");
		}

		order.accessGranted = true;
		await order.save();

		return order;
	}

	static async updateOrderStatus(orderId, status) {
		const order = await Order.findById(orderId);
		if (!order) throw new Error("Order not found");

		order.status = status;
		await order.save();

		console.log(`Order ${orderId} updated to ${status}`);
	}

	static async getOrderDetails(orderId) {
		const order = await Order.findById(orderId).populate("customer").populate("items.book");
		if (!order) throw new Error("Order not found");

		return order;
	}

	static async getUserOrders(userId) {
		const user = await User.findById(userId).populate("customer");
		if (!user || !user.customer) throw new Error("User or customer not found");
		const orders = await Order.find({ customer: user.customer._id }).populate("items.book");

		return orders;
	}

	static async requestRefund(orderId) {
		const order = await Order.findById(orderId);
		if (!order) throw new Error("Order not found");

		order.refundRequested = true;
		await order.save();

		console.log(`Refund requested for order ${orderId}`);
	}

	static async processRefund(orderId) {
		const order = await Order.findById(orderId);
		if (!order) throw new Error("Order not found");

		await order.processRefund();
		console.log(`Refund processed for order ${orderId}`);
	}

	static async cancelOrder(orderId, reason) {
		const order = await Order.findById(orderId);
		if (!order) throw new Error("Order not found");

		if (order.status !== "pending" && order.status !== "processing") {
			throw new Error("Cannot cancel order in current status");
		}

		order.status = "failed";
		order.notes = reason;
		await order.save();

		return order;
	}

	static async generateDownloadLink(orderId, bookId) {
		const order = await Order.findById(orderId);
		if (!order) throw new Error("Order not found");

		if (!order.accessGranted) {
			throw new Error("Access not granted for this order");
		}

		const bookExists = order.items.some((item) => item.book.toString() === bookId);
		if (!bookExists) {
			throw new Error("Book not found in this order");
		}

		// Generate a download link, change it to the domain site once implemented
		const downloadLink = `http://localhost:3000/download/${orderId}/${bookId}`;

		return downloadLink;
	}
}

module.exports = OrderService;
