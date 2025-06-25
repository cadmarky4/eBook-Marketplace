const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
	{
		transactionId: { type: String, required: true, unique: true }, // Unique transaction ID
		customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true }, // Reference to Customer
		items: [
			{
				book: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true }, // Reference to Book
				quantity: { type: Number, required: true, min: 1 },
				price: { type: Number, required: true }, // Store price at time of purchase
			},
		],
		totalPrice: { type: Number, required: true }, // Total cost of the order
		paymentMethod: {
			type: String,
			enum: ["credit_card", "paypal", "stripe", "bank_transfer", "gcash", "maya"],
			required: true,
		}, // Payment method
		purchaseDate: { type: Date, default: Date.now }, // Timestamp of purchase
		paymentProof: {
			paymentProof: String, // File path or base64 string
			notes: String,
			status: {
				type: String,
				enum: ["submitted", "approved", "rejected"],
				default: "submitted",
			},
			submittedAt: Date,
			submittedBy: {
				type: mongoose.Schema.Types.ObjectId,
				ref: "Customer",
			},
			reviewedAt: Date,
			reviewedBy: {
				type: mongoose.Schema.Types.ObjectId,
				ref: "Admin",
			},
			adminNotes: String,
		},
		status: {
			type: String,
			enum: ["pending", "completed", "failed", "refunded"],
			default: "pending",
		}, // Order status
		refundRequested: { type: Boolean, default: false }, // If customer requested a refund
		refundProcessed: { type: Boolean, default: false }, // If refund has been processed
		accessGrant: { type: Boolean, default: false }, // If access to digital content has been granted
		notes: { type: String, default: "" }, // Optional notes for the order
	},
	{ timestamps: true }
); // Adds createdAt and updatedAt fields automatically

// Method to update order status
orderSchema.methods.updateStatus = function (newStatus) {
	this.status = newStatus;
	return this.save();
};

// Method to request a refund
orderSchema.methods.requestRefund = function () {
	if (this.status !== "completed") throw new Error("Refund can only be requested for completed orders.");
	this.refundRequested = true;
	return this.save();
};

// Method to process a refund
orderSchema.methods.processRefund = function () {
	if (!this.refundRequested) throw new Error("Refund has not been requested.");
	this.status = "refunded";
	this.refundProcessed = true;
	return this.save();
};

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
