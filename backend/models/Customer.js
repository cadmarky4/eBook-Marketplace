//import mongoose -jaft
const mongoose = require("mongoose");

//Customer schema
const customerSchema = new mongoose.Schema({
	user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

	preferences: {
		favoriteGenres: [
			{
				type: String,
				enum: ["fiction", "non-fiction", "mystery", "romance", "sci-fi", "fantasy", "biography", "history", "self-help", "technology"],
			},
		],
		readingGoals: {
			booksPerYear: { type: Number, min: 0, max: 1000 },
			currentProgress: { type: Number, default: 0 },
		},
		notifications: {
			newReleases: { type: Boolean, default: true },
			promotions: { type: Boolean, default: true },
			reviews: { type: Boolean, default: true },
		},
		privacy: {
			showProfile: { type: Boolean, default: true },
			showReadingActivity: { type: Boolean, default: false },
			showReviews: { type: Boolean, default: true },
		},
	},
	activeCart: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Cart",
	},

	// Purchase history (completed orders)
	purchaseHistory: [
		{
			orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
			purchaseDate: { type: Date, default: Date.now },
			total: Number,
			itemCount: Number,
		},
	],
	wishlist: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "Book",
		},
	],
	readingList: [
		{
			bookId: { type: mongoose.Schema.Types.ObjectId, ref: "Book" },
			status: { type: String, enum: ["to-read", "currently-reading", "completed", "abandoned"], default: "to-read" },
			progress: { type: Number, min: 0, max: 100, default: 0 },
			startedAt: Date,
			completedAt: Date,
		},
	],
	reviews: [
		{
			bookId: { type: mongoose.Schema.Types.ObjectId, ref: "Book" },
			rating: { type: Number, min: 1, max: 5, required: true },
			reviewText: String,
			reviewDate: { type: Date, default: Date.now },
			helpful: { type: Number, default: 0 },
		},
	],
	addresses: [
		{
			type: { type: String, enum: ["billing", "shipping"], required: true },
			street: String,
			city: String,
			state: String,
			zipCode: String,
			country: { type: String, default: "US" },
			isDefault: { type: Boolean, default: false },
		},
	],
	loyaltyPoints: { type: Number, default: 0 },
	subscriptionPlan: { type: String, enum: ["free", "basic", "standard", "premium"], default: "free" },
});

// Customer-specific methods
customerSchema.methods.addToWishlist = function (bookId) {
	if (!this.wishlist.includes(bookId)) {
		this.wishlist.push(bookId);
	}
	return this.save();
};

customerSchema.methods.removeFromWishlist = function (bookId) {
	this.wishlist = this.wishlist.filter((id) => !id.equals(bookId));
	return this.save();
};

customerSchema.methods.addReview = function (bookId, rating, reviewText) {
	const existingReview = this.reviews.find((review) => review.bookId.equals(bookId));
	if (existingReview) {
		existingReview.rating = rating;
		existingReview.reviewText = reviewText;
		existingReview.reviewDate = new Date();
	} else {
		this.reviews.push({ bookId, rating, reviewText });
	}
	return this.save();
};

customerSchema.methods.updateReadingProgress = function (bookId, progress, status) {
	const reading = this.readingList.find((item) => item.bookId.equals(bookId));
	if (reading) {
		reading.progress = progress;
		reading.status = status || reading.status;
		if (status === "completed" && !reading.completedAt) {
			reading.completedAt = new Date();
		}
	} else {
		this.readingList.push({ bookId, progress, status: status || "currently-reading", startedAt: new Date() });
	}
	return this.save();
};

// Method to create a new cart for the customer
customerSchema.methods.createCart = async function () {
	const Cart = require("./Cart"); // Import Cart model
	const newCart = await Cart.create({ customer: this._id, items: [] });
	this.activeCart = newCart._id;
	return this.save();
};

// Method to clear the customer's cart
customerSchema.methods.clearCart = async function () {
	if (!this.activeCart) return;
	const Cart = require("./Cart");
	await Cart.findByIdAndDelete(this.activeCart);
	this.activeCart = null;
	return this.save();
};

module.exports = mongoose.model("Customer", customerSchema);
