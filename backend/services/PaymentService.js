const axios = require("axios");
const Order = require("../models/Order");
const Customer = require("../models/Customer");

class PaymentService {
	constructor() {
		this.baseURL = "https://api.paymongo.com/v1";
		this.secretKey = process.env.PAYMONGO_SECRET_KEY;
		this.publicKey = process.env.PAYMONGO_PUBLIC_KEY;

		if (!this.secretKey) {
			throw new Error("PayMongo secret key not found in environment variables");
		}
	}

	// Create authorization header
	getAuthHeader() {
		const encoded = Buffer.from(this.secretKey + ":").toString("base64");
		return {
			"Authorization": `Basic ${encoded}`,
			"Content-Type": "application/json",
		};
	}

	// Create payment intent
	async createPaymentIntent({ amount, currency = "PHP", paymentMethod, customerId, orderId }) {
		try {
			const customer = await Customer.findById(customerId);
			if (!customer) throw new Error("Customer not found");

			const data = {
				data: {
					attributes: {
						amount: Math.round(amount * 100), // Convert to centavos
						payment_method_allowed: this.getPayMongoMethod(paymentMethod),
						payment_method_options: {
							card: {
								request_three_d_secure: "automatic",
							},
						},
						currency: currency.toUpperCase(),
						description: `Order payment for ${customer.email}`,
						statement_descriptor: "BOOKSTORE ORDER",
						metadata: {
							order_id: orderId,
							customer_id: customerId,
						},
					},
				},
			};

			const response = await axios.post(`${this.baseURL}/payment_intents`, data, { headers: this.getAuthHeader() });

			return response.data.data;
		} catch (error) {
			console.error("PayMongo payment intent error:", error.response?.data || error.message);
			throw new Error(`Payment intent creation failed: ${error.response?.data?.errors?.[0]?.detail || error.message}`);
		}
	}

	// Create payment method
	async createPaymentMethod({ type, details, billingDetails }) {
		try {
			const data = {
				data: {
					attributes: {
						type,
						details,
						billing: billingDetails,
					},
				},
			};

			const response = await axios.post(`${this.baseURL}/payment_methods`, data, { headers: this.getAuthHeader() });

			return response.data.data;
		} catch (error) {
			console.error("PayMongo payment method error:", error.response?.data || error.message);
			throw new Error(`Payment method creation failed: ${error.response?.data?.errors?.[0]?.detail || error.message}`);
		}
	}

	// Attach payment method to intent
	async attachPaymentMethod(paymentIntentId, paymentMethodId) {
		try {
			const data = {
				data: {
					attributes: {
						payment_method: paymentMethodId,
						client_key: this.publicKey,
					},
				},
			};

			const response = await axios.post(`${this.baseURL}/payment_intents/${paymentIntentId}/attach`, data, { headers: this.getAuthHeader() });

			return response.data.data;
		} catch (error) {
			console.error("PayMongo attach error:", error.response?.data || error.message);
			throw new Error(`Payment attachment failed: ${error.response?.data?.errors?.[0]?.detail || error.message}`);
		}
	}

	// Process GCash payment
	async processGCash({ amount, orderId, customerId }) {
		try {
			const customer = await Customer.findById(customerId);

			const data = {
				data: {
					attributes: {
						amount: Math.round(amount * 100),
						redirect: {
							success: `${process.env.FRONTEND_URL}/payment/success`,
							failed: `${process.env.FRONTEND_URL}/payment/failed`,
						},
						type: "gcash",
						currency: "PHP",
						description: `GCash payment for order ${orderId}`,
						metadata: {
							order_id: orderId,
							customer_id: customerId,
						},
					},
				},
			};

			const response = await axios.post(`${this.baseURL}/sources`, data, { headers: this.getAuthHeader() });

			return response.data.data;
		} catch (error) {
			console.error("GCash payment error:", error.response?.data || error.message);
			throw new Error(`GCash payment failed: ${error.response?.data?.errors?.[0]?.detail || error.message}`);
		}
	}

	// Process Maya payment
	async processMaya({ amount, orderId, customerId }) {
		try {
			const customer = await Customer.findById(customerId);

			const data = {
				data: {
					attributes: {
						amount: Math.round(amount * 100),
						redirect: {
							success: `${process.env.FRONTEND_URL}/payment/success`,
							failed: `${process.env.FRONTEND_URL}/payment/failed`,
						},
						type: "paymaya",
						currency: "PHP",
						description: `Maya payment for order ${orderId}`,
						metadata: {
							order_id: orderId,
							customer_id: customerId,
						},
					},
				},
			};

			const response = await axios.post(`${this.baseURL}/sources`, data, { headers: this.getAuthHeader() });

			return response.data.data;
		} catch (error) {
			console.error("Maya payment error:", error.response?.data || error.message);
			throw new Error(`Maya payment failed: ${error.response?.data?.errors?.[0]?.detail || error.message}`);
		}
	}

	// Confirm payment and update order
	async confirmPayment(paymentIntentId, orderId) {
		try {
			// Get payment intent status from PayMongo
			const paymentIntent = await this.getPaymentIntent(paymentIntentId);

			// Update order based on payment status
			const order = await Order.findById(orderId);
			if (!order) throw new Error("Order not found");

			if (paymentIntent.attributes.status === "succeeded") {
				order.status = "completed";
				order.accessGrant = true;
				order.transactionId = paymentIntentId;
				await order.save();

				return {
					success: true,
					message: "Payment confirmed and order completed",
					order,
				};
			} else if (paymentIntent.attributes.status === "requires_action") {
				return {
					success: false,
					message: "Payment requires additional action",
					next_action: paymentIntent.attributes.next_action,
				};
			} else {
				order.status = "failed";
				await order.save();

				throw new Error(`Payment failed with status: ${paymentIntent.attributes.status}`);
			}
		} catch (error) {
			console.error("Payment confirmation error:", error.message);
			throw error;
		}
	}

	// Get payment intent details
	async getPaymentIntent(paymentIntentId) {
		try {
			const response = await axios.get(`${this.baseURL}/payment_intents/${paymentIntentId}`, { headers: this.getAuthHeader() });

			return response.data.data;
		} catch (error) {
			console.error("Get payment intent error:", error.response?.data || error.message);
			throw new Error(`Failed to retrieve payment intent: ${error.response?.data?.errors?.[0]?.detail || error.message}`);
		}
	}

	// Handle PayMongo webhooks
	async handlePayMongoWebhook(payload, headers) {
		try {
			const event = payload.data;

			switch (event.attributes.type) {
				case "payment_intent.succeeded":
					await this.handleSuccessfulPayment(event.attributes.data);
					break;

				case "payment_intent.payment_failed":
					await this.handleFailedPayment(event.attributes.data);
					break;

				case "source.chargeable":
					await this.handleChargeableSource(event.attributes.data);
					break;

				default:
					console.log(`Unhandled webhook event: ${event.attributes.type}`);
			}

			return { success: true };
		} catch (error) {
			console.error("Webhook handling error:", error.message);
			throw error;
		}
	}

	// Handle successful payment webhook
	async handleSuccessfulPayment(paymentData) {
		try {
			const orderId = paymentData.attributes.metadata?.order_id;
			if (!orderId) return;

			const order = await Order.findById(orderId);
			if (!order) return;

			order.status = "completed";
			order.accessGrant = true;
			order.transactionId = paymentData.id;
			await order.save();

			console.log(`Order ${orderId} marked as completed via webhook`);
		} catch (error) {
			console.error("Handle successful payment error:", error.message);
		}
	}

	// Handle failed payment webhook
	async handleFailedPayment(paymentData) {
		try {
			const orderId = paymentData.attributes.metadata?.order_id;
			if (!orderId) return;

			const order = await Order.findById(orderId);
			if (!order) return;

			order.status = "failed";
			await order.save();

			console.log(`Order ${orderId} marked as failed via webhook`);
		} catch (error) {
			console.error("Handle failed payment error:", error.message);
		}
	}

	// Handle chargeable source (for GCash/Maya)
	async handleChargeableSource(sourceData) {
		try {
			const orderId = sourceData.attributes.metadata?.order_id;
			if (!orderId) return;

			// Create payment using the source
			const paymentData = {
				data: {
					attributes: {
						amount: sourceData.attributes.amount,
						source: {
							id: sourceData.id,
							type: "source",
						},
						currency: "PHP",
						description: `Charge for order ${orderId}`,
					},
				},
			};

			const response = await axios.post(`${this.baseURL}/payments`, paymentData, { headers: this.getAuthHeader() });

			console.log(`Payment created for source ${sourceData.id}`);
		} catch (error) {
			console.error("Handle chargeable source error:", error.message);
		}
	}

	// Convert payment method to PayMongo format
	getPayMongoMethod(paymentMethod) {
		const methodMap = {
			credit_card: ["card"],
			paypal: ["paypal"],
			gcash: ["gcash"],
			maya: ["paymaya"],
			bank_transfer: ["billease"],
			stripe: ["card"],
		};

		return methodMap[paymentMethod] || ["card"];
	}

	// Create refund
	async createRefund(paymentId, amount, reason = "requested_by_customer") {
		try {
			const data = {
				data: {
					attributes: {
						amount: Math.round(amount * 100),
						payment_id: paymentId,
						reason,
					},
				},
			};

			const response = await axios.post(`${this.baseURL}/refunds`, data, { headers: this.getAuthHeader() });

			return response.data.data;
		} catch (error) {
			console.error("Refund creation error:", error.response?.data || error.message);
			throw new Error(`Refund failed: ${error.response?.data?.errors?.[0]?.detail || error.message}`);
		}
	}
}

module.exports = new PaymentService();
