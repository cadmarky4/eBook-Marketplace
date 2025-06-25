"use client";

import React, { useState, useEffect } from "react";
import { navigationState } from "@/components/layouts/Footer";

// Import all page components
import HomePage from "./home/page";
import SearchPage from "./search/page";
import CartPage from "./cart/page";
import LibraryPage from "./library/page";
import ProfilePage from "./profile/page";
import SubscriptionPage from "./subscription/page";

export default function MainPage() {
	// State to track which page to display
	const [activePage, setActivePage] = useState(navigationState.activeItem);

	// Update the active page whenever navigationState changes
	useEffect(() => {
		// Function to check and update active page
		const updateActivePage = () => {
			setActivePage(navigationState.activeItem);
		};

		// Initial check
		updateActivePage();

		// Set up interval to check for changes (since we can't directly subscribe to object changes)
		const intervalId = setInterval(updateActivePage, 100);

		// Clean up interval on unmount
		return () => clearInterval(intervalId);
	}, []);

	// Render the appropriate page based on active state
	const renderActivePage = () => {
		switch (activePage) {
			case "Home":
				return <HomePage />;
			case "Search":
				return <SearchPage />;
			case "Cart":
				return <CartPage />;
			case "Library":
				return <LibraryPage />;
			case "Profile":
				return <ProfilePage />;
			case "Subscription":
				return <SubscriptionPage />;
			default:
				return <HomePage />;
		}
	};

	return <div className="main-page-container">{renderActivePage()}</div>;
}
