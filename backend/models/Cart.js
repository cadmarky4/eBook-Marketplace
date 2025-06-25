const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
	customer: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Customer", // Reference to the Customer model
		required: true,
	},
	items: [
		{
			book: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },
			quantity: { type: Number, required: true, min: 1 },
			price: { type: Number, required: true }, // Store price at the time of adding to cart
		},
	],
	totalPrice: { type: Number, default: 0 }, // Auto-calculated total price
	createdAt: { type: Date, default: Date.now },
	updatedAt: { type: Date, default: Date.now },
});

// Method to calculate total price
cartSchema.methods.calculateTotal = function () {
	this.totalPrice = this.items.reduce((sum, item) => sum + item.quantity * item.price, 0);
	return this.save();
};

// Method to add an item to the cart
cartSchema.methods.addItem = function (bookId, quantity, price) {
	const existingItem = this.items.find((item) => item.book.equals(bookId));
	if (existingItem) {
		existingItem.quantity += quantity;
	} else {
		this.items.push({ book: bookId, quantity, price });
	}
	return this.calculateTotal();
};

// Method to remove an item from the cart
cartSchema.methods.removeItem = function (bookId) {
	this.items = this.items.filter((item) => !item.book.equals(bookId));
	return this.calculateTotal();
};

// Method to clear the cart
cartSchema.methods.clearCart = function () {
	this.items = [];
	this.totalPrice = 0;
	return this.save();
};

const Cart = mongoose.model("Cart", cartSchema);
module.exports = Cart;
