"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Menu, Bell, X, User, Search, ShoppingCart, BookOpen, CreditCard, LogOut, LayoutDashboard, FileUp } from "lucide-react";
import { navigationState } from "@/components/layouts/Footer";
import { publisherNavigationState } from "@/components/layouts/PublisherFooter";
import { useAuth } from "@/components/layouts/AuthContext";

const CURRENCY_RATES = {
	PHP: 1,
	USD: 0.018,
	EUR: 0.017,
	GBP: 0.014,
	JPY: 2.65,
	AUD: 0.028,
	CAD: 0.024,
	SGD: 0.024,
	INR: 1.49,
	MYR: 0.084,
};

const CURRENCY_SYMBOLS = {
	PHP: "₱",
	USD: "$",
	EUR: "€",
	GBP: "£",
	JPY: "¥",
	AUD: "A$",
	CAD: "C$",
	SGD: "S$",
	INR: "₹",
	MYR: "RM",
};

const formatPrice = (priceInPHP, currency) => {
	const convertedPrice = priceInPHP * (CURRENCY_RATES[currency] || 1);
	const symbol = CURRENCY_SYMBOLS[currency] || "₱";
	if (currency === "JPY") {
		return `${symbol}${Math.round(convertedPrice)}`;
	}
	return `${symbol}${convertedPrice.toFixed(2)}`;
};

const detectUserCurrency = () => {
	if (typeof window === "undefined") return "PHP";
	const locale = navigator.language || navigator.userLanguage;
	const currencyMap = {
		"en-US": "USD",
		"en-AU": "AUD",
		"en-CA": "CAD",
		"en-GB": "GBP",
		"en-SG": "SGD",
		"en-PH": "PHP",
		"en-MY": "MYR",
		"en-IN": "INR",
		"en-NZ": "AUD",
		"en-IE": "EUR",
		"en-ZA": "USD",
		"fil-PH": "PHP",
		"tl-PH": "PHP",
		"ceb-PH": "PHP",
		"ja-JP": "JPY",
		"ja": "JPY",
		"zh-CN": "USD",
		"zh-TW": "USD",
		"zh-HK": "USD",
		"zh-SG": "SGD",
		"ms-MY": "MYR",
		"ms-SG": "SGD",
		"ms-BN": "USD",
		"hi-IN": "INR",
		"bn-IN": "INR",
		"ta-IN": "INR",
		"te-IN": "INR",
		"de-DE": "EUR",
		"de-AT": "EUR",
		"de-CH": "EUR",
		"fr-FR": "EUR",
		"fr-CA": "CAD",
		"fr-BE": "EUR",
		"es-ES": "EUR",
		"es-MX": "USD",
		"es-AR": "USD",
		"it-IT": "EUR",
		"pt-PT": "EUR",
		"pt-BR": "USD",
		"nl-NL": "EUR",
		"sv-SE": "EUR",
		"da-DK": "EUR",
		"no-NO": "EUR",
		"fi-FI": "EUR",
		"pl-PL": "EUR",
		"ru-RU": "USD",
		"tr-TR": "USD",
		"ar-SA": "USD",
	};

	if (currencyMap[locale]) return currencyMap[locale];

	const countryCode = locale.split("-")[1];
	const countryToCurrency = {
		US: "USD",
		GB: "GBP",
		AU: "AUD",
		CA: "CAD",
		SG: "SGD",
		PH: "PHP",
		JP: "JPY",
		MY: "MYR",
		IN: "INR",
		NZ: "AUD",
		DE: "EUR",
		FR: "EUR",
		ES: "EUR",
		IT: "EUR",
		NL: "EUR",
	};
	if (countryToCurrency[countryCode]) return countryToCurrency[countryCode];

	return "PHP";
};

const isValidCurrency = (currency) => Object.keys(CURRENCY_RATES).includes(currency);
const getSupportedCurrencies = () => Object.keys(CURRENCY_RATES);

const PublisherHeader = ({ onNavigate = () => {}, onSubscriptionClick = () => {}, onSignIn = () => {}, onSignUp = () => {}, notificationCount = 3 }) => {
	const router = useRouter();
	const pathname = usePathname();
	const { user, loading, logout, refreshUserData } = useAuth();
	const [userCurrency, setUserCurrency] = useState("PHP");
	const [showCurrencySelector, setShowCurrencySelector] = useState(false);
	const [showNotifications, setShowNotifications] = useState(false);
	const [showProfilePanel, setShowProfilePanel] = useState(false);
	const [isMobile, setIsMobile] = useState(false);
	const [internalUser, setInternalUser] = useState({
		name: null,
		fullName: null,
		isPremium: false,
		avatar: null,
		isPublisher: false,
	});

	// Check if we're in publisher mode
	const isPublisherMode = pathname?.startsWith("/publisher");

	// Use the appropriate navigation state based on mode
	const currentNavState = isPublisherMode ? publisherNavigationState : navigationState;

	// Add state to track active navigation item
	const [activeNavItem, setActiveNavItem] = useState(currentNavState?.activeItem || "Home");

	// Update internalUser when user changes
	useEffect(() => {
		if (user) {
			// Create a safe copy with default values for missing properties
			setInternalUser({
				name: user.name || user.fullName || null,
				fullName: user.fullName || user.name || null,
				isPremium: user.isPremium || false,
				avatar: user.avatar || null,
				isPublisher: user.isPublisher || false,
			});
		} else {
			// Reset to defaults when user is null/undefined
			setInternalUser({
				name: null,
				fullName: null,
				isPremium: false,
				avatar: null,
				isPublisher: false,
			});
		}
	}, [user]);

	// Add effect to refresh user data when panel opens
	useEffect(() => {
		if (showProfilePanel && user) {
			refreshUserData();
		}
	}, [showProfilePanel, refreshUserData, user]);

	// Sync with appropriate navigationState when component mounts or mode changes
	useEffect(() => {
		if (isPublisherMode) {
			const savedNavItem = localStorage.getItem("publisherActiveNavItem");
			if (savedNavItem) {
				setActiveNavItem(savedNavItem);
			}
		} else {
			const savedNavItem = localStorage.getItem("activeNavItem");
			if (savedNavItem) {
				setActiveNavItem(savedNavItem);
			}
		}
	}, [isPublisherMode]);

	// Handle sign out
	const handleSignOut = async () => {
		try {
			setShowProfilePanel(false);
			await logout();
		} catch (error) {
			console.error("Logout error:", error);
		}
	};

	// Handle auth-related navigation (still using router)
	const handleSignIn = () => {
		setShowProfilePanel(false);
		router.push("/auth");
	};

	const dummyNotifications = [
		{
			id: 1,
			title: "Order Update",
			message: "Your order #1234 has shipped!",
			time: "2 minutes ago",
		},
		{
			id: 2,
			title: "New Release",
			message: "New book 'React Mastery' released!",
			time: "1 hour ago",
		},
		{
			id: 3,
			title: "Subscription Alert",
			message: "Your subscription is about to expire.",
			time: "3 hours ago",
		},
	];

	// Check if mobile on mount and resize
	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth < 768);
		};

		checkMobile();
		window.addEventListener("resize", checkMobile);
		return () => window.removeEventListener("resize", checkMobile);
	}, []);

	useEffect(() => {
		if (typeof window !== "undefined") {
			const detectedCurrency = detectUserCurrency();
			setUserCurrency(detectedCurrency);
		}
	}, []);

	useEffect(() => {
		const handleClickOutside = (event) => {
			if (showCurrencySelector && !event.target.closest(".currency-selector")) {
				setShowCurrencySelector(false);
			}
			if (showNotifications && !event.target.closest(".notification-bell")) {
				setShowNotifications(false);
			}
		};

		document.addEventListener("click", handleClickOutside);
		return () => document.removeEventListener("click", handleClickOutside);
	}, [showCurrencySelector, showNotifications]);

	useEffect(() => {
		const handleEscKey = (e) => {
			if (e.key === "Escape" && showProfilePanel) {
				setShowProfilePanel(false);
			}
		};

		document.addEventListener("keydown", handleEscKey);
		return () => document.removeEventListener("keydown", handleEscKey);
	}, [showProfilePanel]);

	const handleOverlayClick = (e) => {
		if (e.target === e.currentTarget) {
			setShowProfilePanel(false);
		}
	};

	const handleNavigate = (navItem) => {
		setShowProfilePanel(false);

		// Check if this navigation requires authentication (all publisher features require auth)
		const requiresAuth = isPublisherMode || ["Cart", "Library", "Profile", "Subscription"].includes(navItem);

		if (requiresAuth && !user) {
			// Update navigation state to show modal
			currentNavState.showAuthModal = true;
			currentNavState.attemptedNavigation = navItem;
		} else {
			// Regular navigation
			currentNavState.activeItem = navItem;
			setActiveNavItem(navItem);

			// Save in appropriate localStorage key
			if (isPublisherMode) {
				localStorage.setItem("publisherActiveNavItem", navItem);
			} else {
				localStorage.setItem("activeNavItem", navItem);
			}

			onNavigate(navItem);
		}
	};

	// Special handling for subscription that won't highlight footer items
	const handleSubscriptionClick = () => {
		setShowProfilePanel(false);

		// Check authentication
		if (!user) {
			// Update navigation state to show modal
			currentNavState.showAuthModal = true;
			currentNavState.attemptedNavigation = "Subscription";
			return;
		}

		// Clear the active navigation state in Footer
		currentNavState.activeItem = "";

		// Update local state but keep subscription highlighted in header
		setActiveNavItem("Subscription");

		// Clear localStorage item to avoid persisting this special case
		if (isPublisherMode) {
			localStorage.removeItem("publisherActiveNavItem");
		} else {
			localStorage.removeItem("activeNavItem");
		}

		// Call the subscription callback
		onSubscriptionClick();
	};

	// Updated profile menu click handler with auth checking
	const handleProfileMenuClick = (action) => {
		setShowProfilePanel(false);

		switch (action) {
			// Auth-related actions still use router
			case "SignIn":
				handleSignIn();
				break;
			case "SignUp":
				router.push("/auth");
				break;
			case "SignOut":
				handleSignOut();
				break;
			// Navigation-related actions use state with auth check
			case "Dashboard":
			case "Search":
			case "PublishedBooks":
			case "PublishBook":
			case "Profile":
			case "Cart":
			case "Library":
				handleNavigate(action);
				break;
			case "Subscription":
				handleSubscriptionClick();
				break;
			default:
				console.log("Profile menu navigation:", action);
		}
	};

	// Get the appropriate navigation menu items based on mode
	const getNavigationMenuItems = () => {
		if (isPublisherMode) {
			return [
				{ key: "Dashboard", label: "Dashboard", icon: <LayoutDashboard />, color: "primary" },
				{ key: "Search", label: "Search", icon: <Search />, color: "secondary" },
				{ key: "PublishedBooks", label: "My Books", icon: <BookOpen />, color: "accent" },
				{ key: "PublishBook", label: "Publish Book", icon: <FileUp />, color: "secondary-2" },
				{ key: "Profile", label: "Profile", icon: <User />, color: "secondary" },
			];
		} else {
			return [
				{ key: "Profile", label: "My Profile", icon: <User />, color: "primary" },
				{ key: "Search", label: "Search", icon: <Search />, color: "secondary" },
				{ key: "Cart", label: "Cart", icon: <ShoppingCart />, color: "secondary" },
				{ key: "Library", label: "Library", icon: <BookOpen />, color: "accent" },
				{ key: "Subscription", label: "Subscriptions", icon: <CreditCard />, color: "secondary-2" },
			];
		}
	};

	return (
		<>
			<header className="header">
				<div className="header-content">
					<div className="header-left">
						<button className="profile-btn" onClick={() => setShowProfilePanel(true)} aria-label="Open profile panel">
							{user?.avatar ? (
								<img src={user.avatar} alt="Profile" className="profile-avatar-small" />
							) : (
								<div className="profile-avatar-placeholder">
									<User size={isMobile ? 16 : 20} />
								</div>
							)}
						</button>
						<div className="brand">
							<div className="brand-icon">B</div>
							<span className="brand-text d-none d-sm-inline">BOOKSTORE</span>
						</div>
					</div>

					<div className="header-right">
						<div className="currency-selector">
							<button className="premium-btn" onClick={handleSubscriptionClick}>
								<span className="d-none d-sm-inline">{userCurrency}</span>
								<span className="d-sm-none" style={{ minWidth: "1.5rem", textAlign: "center" }}>
									{user?.isPremium ? "Pro✓" : "Pro"}
								</span>
							</button>
							{showCurrencySelector && (
								<div className="currency-dropdown">
									{Object.keys(CURRENCY_SYMBOLS).map((currency) => (
										<button
											key={currency}
											className={`currency-option ${userCurrency === currency ? "active" : ""}`}
											onClick={() => {
												setUserCurrency(currency);
												setShowCurrencySelector(false);
											}}
										>
											{currency} {CURRENCY_SYMBOLS[currency]}
										</button>
									))}
								</div>
							)}
						</div>

						<button className="premium-btn d-none d-sm-block" onClick={handleSubscriptionClick}>
							{user?.isPremium ? "Premium ✓" : "Get Premium"}
						</button>

						<button className="premium-btn d-sm-none" onClick={handleSubscriptionClick}>
							{user?.isPremium ? "Pro✓" : "Pro"}
						</button>

						<div className="notification-bell">
							<button className="notification-btn" onClick={() => setShowNotifications((prev) => !prev)} aria-label="Notifications">
								<Bell size={20} />
								{notificationCount > 0 && <span className="notification-badge">{notificationCount}</span>}
							</button>
							{showNotifications && (
								<div className="notifications-panel">
									<div className="notifications-header">
										<h3 className="notifications-title">Notifications</h3>
									</div>
									<div className="notifications-list">
										{dummyNotifications.length === 0 ? (
											<div className="no-notifications">No notifications</div>
										) : (
											dummyNotifications.map((notif) => (
												<div key={notif.id} className="notification-item">
													<div className="notification-item-title">{notif.title}</div>
													<div className="notification-item-message">{notif.message}</div>
													<div className="notification-item-time">{notif.time}</div>
												</div>
											))
										)}
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			</header>

			<div className={`profile-panel-overlay ${showProfilePanel ? "show" : ""}`} onClick={handleOverlayClick}>
				<div className={`profile-panel ${showProfilePanel ? "show" : ""}`}>
					<div className="profile-panel-header">
						<h2 className="profile-panel-title">Profile</h2>
						<button className="profile-panel-close" onClick={() => setShowProfilePanel(false)} aria-label="Close profile panel">
							<X size={24} />
						</button>
					</div>

					<div className="profile-panel-content">
						<div className="profile-panel-avatar">
							{user?.avatar ? <img src={user.avatar} alt={user?.name || "User"} className="profile-avatar-large" /> : <div className="profile-avatar-large-placeholder">{user ? user.name?.[0] || "U" : "?"}</div>}
						</div>

						{user ? (
							<>
								<h3 className="profile-panel-name">Hello, {user?.name || user?.fullName || "User"}!</h3>
								<p className="profile-panel-status">{user?.isPremium ? "Premium Member" : "Free Member"}</p>

								{/* Currency Section */}
								<div className="profile-panel-section">
									<div className="section-label">Currency</div>
									{/* ...currency options... */}
								</div>

								{/* Navigation Menu - Updated to use the current mode items */}
								<div className="profile-panel-section">
									<div className="section-label">Quick Navigation</div>
									<nav className="profile-panel-menu">
										{getNavigationMenuItems().map(({ key, label, icon, color }) => (
											<button key={key} className={`profile-panel-menu-item ${color} ${activeNavItem === key ? "active" : ""}`} onClick={() => handleProfileMenuClick(key)}>
												<span className="profile-panel-menu-icon">{icon}</span>
												{label}
											</button>
										))}
									</nav>
								</div>

								{/* Mode Switch Section - UPDATED */}
								{user && user.accountType?.includes("Publisher") && (
									<div className="profile-panel-section publisher-section">
										<div className="section-label">{isPublisherMode ? "Reader Mode" : "Publisher Dashboard"}</div>
										<button
											className="profile-panel-btn primary"
											onClick={() => {
												setShowProfilePanel(false);
												router.push(isPublisherMode ? "/main" : "/publisher");
											}}
										>
											{isPublisherMode ? "Go back to Reader" : "Go to Publisher Dashboard"}
										</button>
									</div>
								)}

								{/* Publisher Sign-up Section (only shown in reader mode for non-publishers) */}
								{!isPublisherMode && !user.accountType?.includes("Publisher") && (
									<div className="profile-panel-section publisher-section">
										<div className="section-label">Want to be a Publisher?</div>
										<button className="profile-panel-btn warning" onClick={() => handleProfileMenuClick("Publisher")}>
											Sign Up as Publisher
										</button>
									</div>
								)}

								{/* Actions */}
								<div className="profile-panel-actions">
									<button className="profile-panel-btn error" onClick={() => handleProfileMenuClick("SignOut")}>
										<LogOut size={18} />
										Log Out
									</button>
								</div>
							</>
						) : (
							<>
								<h3 className="profile-panel-name">Hello, Visitor!</h3>
								<p className="profile-panel-greeting">Want to save progress? Sign up!</p>
								<div className="profile-panel-actions">
									<button className="profile-panel-btn primary" onClick={() => handleProfileMenuClick("SignUp")}>
										Sign Up
									</button>
								</div>
								<p className="sign-in-prompt">
									Already have an account?{" "}
									<button className="sign-in-link" onClick={() => handleProfileMenuClick("SignIn")}>
										Sign In
									</button>
								</p>
							</>
						)}
					</div>
				</div>
			</div>
		</>
	);
};

PublisherHeader.formatPrice = formatPrice;
PublisherHeader.detectUserCurrency = detectUserCurrency;
PublisherHeader.isValidCurrency = isValidCurrency;
PublisherHeader.getSupportedCurrencies = getSupportedCurrencies;
PublisherHeader.CURRENCY_RATES = CURRENCY_RATES;
PublisherHeader.CURRENCY_SYMBOLS = CURRENCY_SYMBOLS;

export { formatPrice, detectUserCurrency, isValidCurrency, getSupportedCurrencies, CURRENCY_RATES, CURRENCY_SYMBOLS };
export default PublisherHeader;
