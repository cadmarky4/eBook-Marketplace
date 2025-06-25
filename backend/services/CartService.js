const Cart = require("../models/Cart");
const Book = require("../models/Book");
const User = require("../models/User");
const Customer = require("../models/Customer");

class CartService {

	// Get customer's cart
    static async getCustomerCart(customerId) {
        const customer = await Customer.findById(customerId);
        if (!customer) throw new Error("Customer not found");

        let cart = await Cart.findOne({ customer: customerId }).populate('items.book');
        
        // Create cart if it doesn't exist
        if (!cart) {
            cart = await Cart.create({ customer: customerId, items: [] });
            customer.activeCart = cart._id;
            await customer.save();
        }

        return cart;
    }

	static async mergeGuestCart(customerId, guestCartItems) {
        const customer = await Customer.findById(customerId);
        if (!customer) throw new Error("Customer not found");

        let cart = await Cart.findOne({ customer: customerId });
        
        if (!cart) {
            cart = await Cart.create({ customer: customerId, items: [] });
            customer.activeCart = cart._id;
            await customer.save();
        }

        // Merge guest items with existing cart
        for (const guestItem of guestCartItems) {
            const existingItem = cart.items.find(item => 
                item.book.toString() === guestItem.book._id
            );

            if (existingItem) {
                existingItem.quantity += guestItem.quantity;
            } else {
                cart.items.push({
                    book: guestItem.book._id,
                    quantity: guestItem.quantity,
                    price: guestItem.price
                });
            }
        }

        await cart.calculateTotal();
        return cart.populate('items.book');
    }

	static async addBookToCart(cartId, bookId, quantity, price) {
		const cart = await Cart.findById(cartId);
		if (!cart) throw new Error("Cart not found");

		const book = await Book.findById(bookId);
		if (!book) throw new Error("Book not found");
		await cart.addItem(bookId, quantity, book.price);
		return cart;
	}

	static async updateBookQuantity(customerId, bookId, quantity) {
		const cart = await Cart.findOne({ customer: customerId });
		if (!cart) throw new Error("Cart not found");

		await cart.updateItemQuantity(bookId, quantity);
		return await Cart.findById(cart._id).populate('items.book');
	}

	static async removeBookFromCart(customerId, bookId) {
		const cart = await Cart.findOne({ customer: customerId })
		if (!cart) throw new Error("Cart not found");

		await cart.removeItem(bookId);
		return cart.populate('items.book');
		console.log("Book removed from cart!");
	}

	static async clearCustomerCart(customerId) {
		const customer = await Customer.findById(customerId);
		if (!customer) throw new Error("Customer not found");

		await customer.clearCart();
		return true;
		console.log("Cart cleared!");
	}
}

module.exports = CartService;
