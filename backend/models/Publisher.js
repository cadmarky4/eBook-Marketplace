//import mongoose -jaft
const mongoose = require("mongoose");

//Publisher schema
const publisherSchema = new mongoose.Schema({
	user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

	// Publisher-specific fields
	penName: {
		type: String,
		trim: true,
	},
	biography: {
		type: String,
		maxlength: 2000,
	},
	website: {
		type: String,
		trim: true,
	},
	socialMedia: {
		twitter: String,
		facebook: String,
		instagram: String,
		goodreads: String,
	},
	genres: [
		{
			type: String,
			enum: ["fiction", "non-fiction", "mystery", "romance", "sci-fi", "fantasy", "biography", "history", "self-help", "technology"],
		},
	],
	publishedBooks: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "Book",
		},
	],
	earnings: {
		totalEarnings: {
			type: Number,
			default: 0,
		},
		currentMonthEarnings: {
			type: Number,
			default: 0,
		},
		pendingPayment: {
			type: Number,
			default: 0,
		},
		lastPaymentDate: Date,
	},
	commissionRate: {
		type: Number,
		min: 0,
		max: 1,
		default: 0.7, // 70% default royalty rate
	},
	bankAccount: {
		accountName: String,
		accountNumber: String,
		routingNumber: String,
		bankName: String,
	},
	taxInfo: {
		taxId: String,
		w9Submitted: {
			type: Boolean,
			default: false,
		},
	},
	publisherVerification: {
		isVerified: {
			type: Boolean,
			default: false,
		},
		verificationDate: Date,
		documentsSubmitted: Boolean,
	},
	stats: {
		totalSales: {
			type: Number,
			default: 0,
		},
		totalDownloads: {
			type: Number,
			default: 0,
		},
		averageRating: {
			type: Number,
			min: 0,
			max: 5,
			default: 0,
		},
		totalReviews: {
			type: Number,
			default: 0,
		},
	},
});

// Publisher-specific methods
publisherSchema.methods.addBook = function (bookId, options = {}) {
	if (!this.publishedBooks.includes(bookId)) {
		this.publishedBooks.push(bookId);
	}
	return this.save(options);
};

publisherSchema.methods.updateEarnings = function (amount) {
	this.earnings.totalEarnings += amount;
	this.earnings.currentMonthEarnings += amount;
	this.earnings.pendingPayment += amount;
	return this.save();
};

publisherSchema.methods.processPayment = function (amount) {
	this.earnings.pendingPayment -= amount;
	this.earnings.lastPaymentDate = new Date();
	return this.save();
};

publisherSchema.methods.getDisplayName = function () {
	return this.penName;
};

module.exports = mongoose.model("Publisher", publisherSchema);
