const CartService = require("../services/CartService");


class CartController {

	static async getCart(req, res) {
        try {
            const customerId = req.user.customer._id; // Get from authenticated user
            const cart = await CartService.getCustomerCart(customerId);
            res.status(200).json({ success: true, cart });
        } catch (err) {
            console.error("Get cart error:", err);
            res.status(400).json({ success: false, error: err.message });
        }
    }

	static async mergeGuestCart(req, res) {
        try {
            const { guestCartItems } = req.body;
            const customerId = req.user.customer._id;
            
            const cart = await CartService.mergeGuestCart(customerId, guestCartItems);
            res.status(200).json({ success: true, cart, message: "Guest cart merged successfully" });
        } catch (err) {
            console.error("Merge guest cart error:", err);
            res.status(400).json({ success: false, error: err.message });
        }
    }


	static async addToCart(req, res) {
		try {
            const { bookId, quantity = 1 } = req.body;
            const customerId = req.user.customer._id;
            
			if (req.user && req.user.customer) {
                // Authenticated user - use database cart
                const customerId = req.user.customer._id;
            const cart = await CartService.addBookToCart(customerId, bookId, quantity);
            res.status(201).json({ success: true, cart });
			} else {
				// Guest user - return success (frontend handles localStorage)
                res.status(201).json({ 
                    success: true, 
                    message: 'Item ready to be added to guest cart',
                    type: 'guest'
                });
			}
        } catch (err) {
            console.error("Add to Cart error:", err);
            res.status(400).json({ success: false, error: err.message });
        }
	}

	static async updateQuantity(req, res) {
		try {
			const { bookId, quantity } = req.body;
            const customerId = req.user.customer._id;

			if (req.user && req.user.customer) {
                // Authenticated user - update database cart
                const customerId = req.user.customer._id;
			const cart = await CartService.updateBookQuantity(req.body);
			res.status(200).json({ success: true, cart });
			} else {
				// Guest user - return success (frontend handles localStorage)
                res.status(200).json({ 
                    success: true, 
                    message: 'Quantity ready to be updated in guest cart',
                    type: 'guest'
                });
			}
		} catch (err) {
			console.error("Update quantity error:", err);
			res.status(400).json({ success: false, error: err.message });
		}
	}

	static async removeFromCart(req, res) {
		try {
			const { bookId } = req.body;
            const customerId = req.user.customer._id;

			if (req.user && req.user.customer) {
                // Authenticated user - remove from database cart
                const customerId = req.user.customer._id;
			const cart = await CartService.removeBookFromCart(req.body);
			res.status(201).json(cart);
			} else {
				// Guest user - return success (frontend handles localStorage)
				res.status(201).json({ 
					success: true, 
					message: 'Item ready to be removed from guest cart',
					type: 'guest'
				});
			}
		} catch (err) {
			console.error("Cart remove error: ", err);
			res.status(400).json({ error: err.message });
		}
	}

	static async clearCart(req, res) {
		try {
			if (req.user && req.user.customer) {
                // Authenticated user - clear database cart
                const customerId = req.user.customer._id;
				const cart = await CartService.clearCustomerCart(req.body);
				res.status(201).json(cart);
			} else {
				// Guest user - return success (frontend handles localStorage)
				res.status(201).json({ 
					success: true, 
					message: 'Cart cleared in guest mode',
					type: 'guest'
				});
			}
		} catch (err) {
			console.error("Clear cart error: ", err);
			res.status(400).json({ error: err.message });
		}
	}
}

module.exports = CartController;
