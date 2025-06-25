"use client";

import React, { useState, useEffect } from "react";
import { publisherNavigationState } from "@/components/layouts/PublisherFooter";

// Import all page components
import DashboardPage from "./dashboard/page";
import SearchPage from "../main/search/page";
import UploadPage from "./upload/page";
import MyBooksPage from "./mybooks/page";
import ProfilePage from "../main/profile/page";
import SubscriptionPage from "../main/subscription/page";

export default function MainPage() {
	// State to track which page to display
	const [activePage, setActivePage] = useState(publisherNavigationState.activeItem);

	// Update the active page whenever publisherNavigationState changes
	useEffect(() => {
		// Function to check and update active page
		const updateActivePage = () => {
			setActivePage(publisherNavigationState.activeItem);
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
			case "Dashboard":
				return <DashboardPage />;
			case "Search":
				return <SearchPage />;
			case "MyBooks":
				return <MyBooksPage />;
			case "PublishBook":
				return <UploadPage />;
			case "Profile":
				return <ProfilePage />;
			case "Subscription":
				return <SubscriptionPage />;
			default:
				return <DashboardPage />;
		}
	};

	return <div className="main-page-container">{renderActivePage()}</div>;
}
