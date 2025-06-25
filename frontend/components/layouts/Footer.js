"use client";

import React, { useState, useEffect } from "react";
import { Home, Search, ShoppingCart, Bookmark, User } from "lucide-react";
import { useAuth } from "@/components/layouts/AuthContext";
import Modal, { ModalHeader, ModalBody } from "@/components/features/AuthModal";

// Create a navigation state object that can be shared across components
const navigationState = {
	activeItem: "Home",
	showAuthModal: false,
	attemptedNavigation: null,
};

const Footer = () => {
	const { user } = useAuth(); // Get auth status
	let accountType = "Customer"; // To be fetched in the database
	const [activeNavItem, setActiveNavItem] = useState(navigationState.activeItem);
	const [showAuthModal, setShowAuthModal] = useState(false);
	const [attemptedNavigation, setAttemptedNavigation] = useState(null);

	// Load the saved navigation state when component mounts
	useEffect(() => {
		const savedNavItem = localStorage.getItem("activeNavItem");
		if (savedNavItem) {
			navigationState.activeItem = savedNavItem;
			setActiveNavItem(savedNavItem);
		}
	}, []);

	// Add an effect to listen for changes to navigationState
	useEffect(() => {
		const checkNavigationState = () => {
			if (navigationState.activeItem !== activeNavItem) {
				setActiveNavItem(navigationState.activeItem);
			}
			if (navigationState.showAuthModal !== showAuthModal) {
				setShowAuthModal(navigationState.showAuthModal);
			}
			if (navigationState.attemptedNavigation !== attemptedNavigation) {
				setAttemptedNavigation(navigationState.attemptedNavigation);
			}
		};

		const intervalId = setInterval(checkNavigationState, 100);
		return () => clearInterval(intervalId);
	}, [activeNavItem, showAuthModal, attemptedNavigation]);

	const handleNavClick = (navItem) => {
		// Check if this navigation requires authentication
		const requiresAuth = ["Cart", "Library", "Profile", "Subscription"].includes(navItem);

		if (requiresAuth && !user) {
			// Update navigation state to show modal
			navigationState.showAuthModal = true;
			navigationState.attemptedNavigation = navItem;
			setShowAuthModal(true);
			setAttemptedNavigation(navItem);
		} else {
			// Regular navigation
			navigationState.activeItem = navItem;
			setActiveNavItem(navItem);
			localStorage.setItem("activeNavItem", navItem);
		}
	};

	const handleCloseAuthModal = () => {
		navigationState.showAuthModal = false;
		setShowAuthModal(false);
	};

	const handleGoToAuth = () => {
		navigationState.showAuthModal = false;
		setShowAuthModal(false);
		// Navigate to auth page
		window.location.href = "/auth";
	};

	return (
		<>
			<div className="bottom-nav d-flex justify-content-around py-2">
				<button className={`nav-item-btn d-flex flex-column align-items-center ${activeNavItem === "Home" ? "active" : ""}`} onClick={() => handleNavClick("Home")}>
					<Home size={20} />
					<small>Home</small>
				</button>

				<button className={`nav-item-btn d-flex flex-column align-items-center ${activeNavItem === "Search" ? "active" : ""}`} onClick={() => handleNavClick("Search")}>
					<Search size={20} />
					<small>Search</small>
				</button>

				<button className={`nav-item-btn d-flex flex-column align-items-center ${activeNavItem === "Cart" ? "active" : ""}`} onClick={() => handleNavClick("Cart")}>
					<ShoppingCart size={20} />
					<small>Cart</small>
				</button>

				<button className={`nav-item-btn d-flex flex-column align-items-center ${activeNavItem === "Library" ? "active" : ""}`} onClick={() => handleNavClick("Library")}>
					<Bookmark size={20} />
					<small>Library</small>
				</button>

				<button className={`nav-item-btn d-flex flex-column align-items-center ${activeNavItem === "Profile" ? "active" : ""}`} onClick={() => handleNavClick("Profile")}>
					<User size={20} />
					<small>Profile</small>
				</button>
			</div>

			{/* Auth Required Modal */}
			<Modal isOpen={showAuthModal} onClose={handleCloseAuthModal} size="sm">
				<ModalHeader onClose={handleCloseAuthModal}>
					<h5 className="modal-title">Authentication Required</h5>
				</ModalHeader>
				<ModalBody>
					<div className="text-center mb-4">
						<div className="auth-icon mb-3" style={{ fontSize: "2rem" }}>
							🔒
						</div>
						<h4>Login Required</h4>
						<p className="text-muted">You need to be logged in to access {attemptedNavigation || "this feature"}.</p>
					</div>
					<div className="d-flex gap-2 justify-content-center">
						<button
							className="btn btn-secondary"
							onClick={handleCloseAuthModal}
							style={{
								backgroundColor: "#f8f9fa",
								border: "1px solid #dee2e6",
								borderRadius: "0.375rem",
								padding: "0.5rem 1rem",
								marginRight: "0.5rem",
							}}
						>
							Cancel
						</button>
						<button
							className="btn btn-primary"
							onClick={handleGoToAuth}
							style={{
								backgroundColor: "#000022",
								color: "white",
								border: "none",
								borderRadius: "0.375rem",
								padding: "0.5rem 1rem",
							}}
						>
							Sign In
						</button>
					</div>
				</ModalBody>
			</Modal>
		</>
	);
};

// Export for use in other components
export { navigationState };

// Export as default to be imported in other files
export default Footer;
