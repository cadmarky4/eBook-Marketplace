"use client";

import React, { useState } from "react";

const Cart = () => {
	const [cartItems, setCartItems] = useState([
		{ id: 1, title: "Book Title One", author: "Author Name", price: 19.99, quantity: 1 },
		{ id: 2, title: "Book Title Two", author: "Author Name", price: 14.99, quantity: 1 },
	]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [isAuthenticated, setIsAuthenticated] = useState(false);
    const router = useRouter();

	// Check if user is authenticated
    const checkAuth = () => {
        const token = localStorage.getItem('token');
        return !!token;
    };

    // Get auth token
    const getAuthToken = () => {
        return localStorage.getItem('token');
    };

	// Guest cart functions (localStorage)
    const getGuestCart = () => {
        try {
            const cart = localStorage.getItem('guestCart');
            return cart ? JSON.parse(cart) : [];
        } catch (error) {
            console.error('Error parsing guest cart:', error);
            return [];
        }
    };

    const saveGuestCart = (items) => {
        localStorage.setItem('guestCart', JSON.stringify(items));
    };

    // Merge guest cart when user logs in
    const mergeGuestCartWithUser = async () => {
        const guestItems = getGuestCart();
        if (guestItems.length === 0) return;

        try {
            const token = getAuthToken();
            const response = await fetch('/api/cart/merge', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ guestCartItems: guestItems }),
            });

            if (response.ok) {
                // Clear guest cart after successful merge
                localStorage.removeItem('guestCart');
                // Refresh user cart
                fetchUserCart();
            }
        } catch (err) {
            console.error('Error merging guest cart:', err);
        }
    };


	// Fetch cart items on component mount
    useEffect(() => {
        const authenticated = checkAuth();
        setIsAuthenticated(authenticated);
        
        if (authenticated) {
            fetchUserCart();
        } else {
            fetchGuestCart();
        }
    }, []);

    const fetchUserCart = async () => {
        try {
            setLoading(true);
            const token = getAuthToken();
            
            const response = await fetch('/api/cart', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

			if (!response.ok) {
                throw new Error('Failed to fetch cart items');
            }

            const data = await response.json();
            setCartItems(data.cart.items || []);
        } catch (err) {
            setError(err.message);
            console.error('Error fetching user cart:', err);
        } finally {
            setLoading(false);
        }
    };

	const fetchGuestCart = () => {
        try {
            setLoading(true);
            const guestItems = getGuestCart();
            setCartItems(guestItems);
        } catch (err) {
            setError(err.message);
            console.error('Error fetching guest cart:', err);
        } finally {
            setLoading(false);
        }
    };

	const addToGuestCart = (book, quantity = 1) => {
        const currentCart = getGuestCart();
        const existingItem = currentCart.find(item => item.book._id === book._id);

        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            currentCart.push({
                book: book,
                quantity: quantity,
                price: book.price
            });
        }

        saveGuestCart(currentCart);
        setCartItems(currentCart);
    };

	const removeFromGuestCart = (bookId) => {
        const currentCart = getGuestCart();
        const updatedCart = currentCart.filter(item => item.book._id !== bookId);
        saveGuestCart(updatedCart);
        setCartItems(updatedCart);
    };

    const clearGuestCart = () => {
        localStorage.removeItem('guestCart');
        setCartItems([]);
    };

const updateQuantity = async (bookId, newQuantity) => {
    if (newQuantity < 1) {
        removeItem(bookId);
        return; 
    }

    try {
        const token = getAuthToken();
        const headers = {
            'Content-Type': 'application/json',
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch('/api/cart/update', {
            method: 'POST',
            headers,
            body: JSON.stringify({ bookId, quantity: newQuantity }),
        });

        if (!response.ok) {
            throw new Error('Failed to update quantity');
        }

        const data = await response.json();
        
        if (data.type === 'user') {
            // Update from server response
            setCartItems(data.cart.items || []);
        } else {
            // Handle guest cart locally
            const currentCart = getGuestCart();
            const updatedCart = currentCart.map(item => 
                item.book._id === bookId 
                    ? { ...item, quantity: newQuantity }
                    : item
            );
            saveGuestCart(updatedCart);
            setCartItems(updatedCart);
        }
    } catch (err) {
        setError(err.message);
        console.error('Error updating quantity:', err);
    }
};

const removeItem = async (bookId) => {
    try {
        const token = getAuthToken();
        const headers = {
            'Content-Type': 'application/json',
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch('/api/cart/remove', {
            method: 'POST',
            headers,
            body: JSON.stringify({ bookId }),
        });

        if (!response.ok) {
            throw new Error('Failed to remove item');
        }

        const data = await response.json();
        
        if (data.type === 'user') {
            // Update from server response
            setCartItems(data.cart.items || []);
        } else {
            // Handle guest cart locally
            removeFromGuestCart(bookId);
        }
    } catch (err) {
        setError(err.message);
        console.error('Error removing item:', err);
    }
};

//replace router to the right payment page
const handleCheckout = () => {
        if (!isAuthenticated) {
            // Redirect to login if not authenticated
            router.push('/login?redirect=/main/cart');
            return;
        }
        
        if (cartItems.length === 0) {
            alert('Your cart is empty');
            return;
        }

        // Proceed to checkout
        router.push('/checkout');
    };

	const totalPrice = cartItems.reduce((total, item) => {
        const price = item.book?.price || item.price || 0;
        return total + price * item.quantity}, 0);

    if (loading) return <div>Loading cart...</div>;
    if (error) return <div>Error: {error}</div>;
	return (
		<div className="cart-container">
			<div className="cart-content">
				<h2 className="cart-title">Shopping Cart</h2>
				{!isAuthenticated && (
                    <div className="guest-warning">
                        <p>You're shopping as a guest. <a href="/login">Log in</a> to save your cart.</p>
                    </div>
                )}
                <div className="cart-items">
                    {cartItems.length === 0 ? (
                        <p>Your cart is empty</p>
                    ) : (
                        
                            
					cartItems.map((item) => {
                        const book = item.book || item; // Handle both user and guest cart structures
                        const itemId = book._id || book.id;

                        return (
                            <div key={item.id} className="cart-item">
                                <div className="item-info">
                                    <h3 className="item-title">{item.title}</h3>
                                    <p className="item-author">by {item.author}</p>
                                    <p className="item-price">${item.price.toFixed(2)}</p>
                                </div>
                                <div className="item-controls">
                                    <div className="quantity-controls">
                                        <button 
                                            onClick={() => updateQuantity(itemId, item.quantity - 1)}
                                            className="quantity-btn"
                                        >
                                            -
                                        </button>
                                        <span className="quantity">{item.quantity}</span>
                                        <button 
                                            onClick={() => updateQuantity(itemId, item.quantity + 1)}
                                            className="quantity-btn"
                                        >
                                            +
                                        </button>
                                    </div>
                                    <button onClick={() => removeItem(item.id)} className="remove-button">
                                        Remove
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
				</div>
				<div className="order-summary">
					<h3 className="summary-title">Order Summary</h3>
					<div className="total-price">Total: ${totalPrice.toFixed(2)}</div>
					<button className="checkout-button" onClick={handleCheckout} disabled={cartItems.length === 0}>Checkout</button>
				</div>
			</div>
		</div>
	);
};

export default Cart;
