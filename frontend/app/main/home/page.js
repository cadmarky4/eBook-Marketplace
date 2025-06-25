"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Image from "next/image";

import { formatPrice, detectUserCurrency } from "@/components/layouts/Header.js";
import AuthModal from "@/components/features/AuthModal.js";
import { BookCard } from "@/components/features/BookCard";
import { CategoryTab } from "@/components/features/CategoryTab";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import BookView from "../view/page"; // Import the BookView component

// Fallback data for when server is down
const fallbackData = {
	categories: ["Fiction", "Non-Fiction", "Science", "Technology", "Business", "Self-Help"],
	dummyBook: {
		id: "dummy-1",
		title: "The Digital Revolution",
		author: "Jane Smith",
		price: 19.99,
		originalPrice: 29.99,
		rating: 4.5,
		ratingCount: 128,
		coverImage: "/images/fallback-cover.jpg",
		description: "An insightful journey into the world of technology and its impact on society.",
		pages: 342,
		language: "English",
		publishedDate: "2024-03-15",
		publisher: "Tech Press",
		discount: 33,
		isNew: true,
		isBestseller: true,
	},
};

// Category Dropdown Component
const CategoryDropdown = ({ categories = [], activeCategory, onCategorySelect, className = "" }) => {
	const [isOpen, setIsOpen] = useState(false);
	const dropdownRef = useRef(null);

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
				setIsOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	const handleCategoryClick = (category) => {
		onCategorySelect(category);
		setIsOpen(false);
	};

	return (
		<div className={`category-dropdown-wrapper ${className}`} ref={dropdownRef}>
			<button className="category-dropdown-button" onClick={() => setIsOpen(!isOpen)} aria-expanded={isOpen} aria-haspopup="true">
				<span className="category-dropdown-text">{activeCategory}</span>
				<svg className={`category-dropdown-arrow ${isOpen ? "open" : ""}`} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
					<polyline points="6,9 12,15 18,9"></polyline>
				</svg>
			</button>

			{isOpen && (
				<div className="category-dropdown-menu">
					<div className="category-dropdown-content">
						{categories.map((category) => (
							<button key={category} className={`category-dropdown-item ${activeCategory === category ? "active" : ""}`} onClick={() => handleCategoryClick(category)}>
								{category}
							</button>
						))}
					</div>
				</div>
			)}
		</div>
	);
};

// Main HomePage Component
const HomePage = ({ initialData = null }) => {
	// Consolidated state management
	const [activeCategory, setActiveCategory] = useState("Popular");
	const [activeNavItem, setActiveNavItem] = useState("Home");
	const [showAllCategories, setShowAllCategories] = useState(false);
	const [showDropdown, setShowDropdown] = useState(false); // New state for dropdown toggle
	const [isMobile, setIsMobile] = useState(false);
	const [userCurrency, setUserCurrency] = useState("PHP");
	const [authModal, setAuthModal] = useState({ show: false, isSignUp: false });
	const [data, setData] = useState({
		categories: [],
		topSellingBooks: [],
		newlyReleasedBooks: [],
		featuredBooks: [],
		user: {
			isAuthenticated: false,
			isPremium: false,
			name: null,
			email: null,
		},
	});
	const [isLoading, setIsLoading] = useState(true);
	const [expandedGroup, setExpandedGroup] = useState(null);
	const [selectedBookId, setSelectedBookId] = useState(null);
	const [isViewingBook, setIsViewingBook] = useState(false);

	const handleBookClick = useCallback((book) => {
		setSelectedBookId(book.id);
		setIsViewingBook(true);
	}, []);

	const handleBackFromBookView = useCallback(() => {
		setIsViewingBook(false);
		setSelectedBookId(null);
	}, []);

	// Destructuring data
	const { categories, topSellingBooks, newlyReleasedBooks, user } = data;

	// Device and currency detection - only runs once on mount
	useEffect(() => {
		if (typeof window !== "undefined") {
			// Detect user currency
			setUserCurrency(detectUserCurrency());

			// Check if mobile and set up resize listener
			const checkMobile = () => {
				const mobile = window.innerWidth < 768;
				setIsMobile(mobile);
				// Auto-switch to dropdown on mobile if many categories
				if (mobile && categories.length > 6) {
					setShowDropdown(true);
				}
			};
			checkMobile();
			window.addEventListener("resize", checkMobile);
			return () => window.removeEventListener("resize", checkMobile);
		}
	}, [categories.length]);

	// Data fetching - consolidated into a single effect
	useEffect(() => {
		const fetchData = async () => {
			if (typeof window === "undefined") return;

			setIsLoading(true);

			try {
				// Fetch all data in parallel
				const [categoriesRes, topSellingRes, newlyReleasedRes] = await Promise.all([
					fetch("/api/categories")
						.then((res) => res.json())
						.catch(() => ({ success: false, categories: [] })),
					fetch("/api/books/top-selling?limit=4")
						.then((res) => res.json())
						.catch(() => ({ success: false, books: [] })),
					fetch("/api/books/newly-released?limit=4")
						.then((res) => res.json())
						.catch(() => ({ success: false, books: [] })),
				]);

				// Create arrays with fallback data if API fails
				const topSellingBooks = topSellingRes.success ? topSellingRes.books : [];
				const newlyReleasedBooks = newlyReleasedRes.success ? newlyReleasedRes.books : [];
				const categories = categoriesRes.success ? categoriesRes.categories : [];

				// If all book data is empty, add fallback dummy book
				const useTopSellingFallback = topSellingBooks.length === 0;
				const useNewlyReleasedFallback = newlyReleasedBooks.length === 0;
				const useCategoriesFallback = categories.length === 0;

				setData({
					categories: useCategoriesFallback ? fallbackData.categories : categories,
					topSellingBooks: useTopSellingFallback ? [fallbackData.dummyBook] : topSellingBooks,
					newlyReleasedBooks: useNewlyReleasedFallback ? [fallbackData.dummyBook] : newlyReleasedBooks,
					featuredBooks: [],
					user: {
						isAuthenticated: false,
						isPremium: false,
						name: null,
						email: null,
					},
				});
			} catch (error) {
				console.error("Error fetching data:", error);
				// Use fallback data in case of errors
				setData({
					categories: fallbackData.categories,
					topSellingBooks: [fallbackData.dummyBook],
					newlyReleasedBooks: [fallbackData.dummyBook],
					featuredBooks: [],
					user: {
						isAuthenticated: false,
						isPremium: false,
						name: null,
						email: null,
					},
				});
			} finally {
				setIsLoading(false);
			}
		};

		fetchData();
	}, []);

	// Close dropdowns when clicking outside - using useCallback
	useEffect(() => {
		const handleClickOutside = (event) => {
			if (!event.target.closest(".categories-dropdown")) {
				setShowAllCategories(false);
			}
		};

		document.addEventListener("click", handleClickOutside);
		return () => document.removeEventListener("click", handleClickOutside);
	}, []);

	// Memoized filtered categories
	const displayCategories = useMemo(() => {
		if (!categories) return [];
		return isMobile && !showAllCategories ? categories.slice(0, 6) : categories;
	}, [categories, isMobile, showAllCategories]);

	// Event handlers with useCallback to prevent unnecessary re-renders
	const handleCategorySelect = useCallback(
		(category) => {
			setActiveCategory(category);
			if (isMobile) {
				setShowAllCategories(false);
			}
		},
		[isMobile]
	);

	const toggleSubcategories = useCallback(
		(index) => {
			setExpandedGroup(expandedGroup === index ? null : index);
		},
		[expandedGroup]
	);

	// Authentication handlers
	const requireAuth = useCallback(
		(action) => {
			if (!user?.isAuthenticated) {
				setAuthModal({ show: true, isSignUp: false });
				return false;
			}
			return true;
		},
		[user]
	);

	const handleBuyNow = useCallback(
		(book) => {
			if (requireAuth("purchase")) {
				console.log("Proceeding with purchase for:", book.title);
				// Actual purchase logic would go here
			}
		},
		[requireAuth]
	);

	const handleAddToCart = useCallback(
		(book) => {
			if (requireAuth("cart")) {
				console.log("Adding to cart:", book.title);
				// Actual cart logic would go here
			}
		},
		[requireAuth]
	);

	const closeAuthModal = useCallback(() => {
		setAuthModal((prev) => ({ ...prev, show: false }));
	}, []);

	const toggleSignUpMode = useCallback((isSignUp) => {
		setAuthModal((prev) => ({ ...prev, isSignUp }));
	}, []);

	// Toggle between dropdown and tabs view
	const toggleViewMode = useCallback(() => {
		setShowDropdown((prev) => !prev);
	}, []);

	if (isViewingBook && selectedBookId) {
		return <BookView bookId={selectedBookId} onBack={handleBackFromBookView} onAddToCart={handleAddToCart} onSubscribe={() => console.log(`Subscribe to book: ${selectedBookId}`)} />;
	}

	// Show loading state
	if (isLoading) {
		return (
			<div className="landing-container">
				<div className="d-flex justify-content-center align-items-center" style={{ height: "50vh" }}>
					<div className="spinner-border text-primary" role="status">
						<span className="visually-hidden">Loading...</span>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="landing-container">
			{/* Hero Section */}
			<section className="hero-section">
				<div className="hero-content">
					<div className="featured-card">
						<div className="featured-content">
							<div className="featured-icon">📚</div>
							<h2 className="featured-title">Featured Book Carousel</h2>
							<p className="featured-subtitle">Swipe to explore our handpicked selections</p>
						</div>
					</div>
				</div>
			</section>

{/* Category Selection Section */}
<section className="category-selection-section">
  <div className="container">
    <div className="category-header">
      <h3>Browse Categories</h3>
    </div>
    <div className="horizontal-category-tabs-wrapper" style={{ background: "#fff", borderRadius: "8px", padding: "1rem", display: "flex", alignItems: "center", gap: "1rem" }}>
      {showDropdown ? (
        <CategoryDropdown
          categories={categories}
          activeCategory={activeCategory}
          onCategorySelect={handleCategorySelect}
          className="mb-4"
        />
      ) : (
        <div className="horizontal-category-tabs">
          {displayCategories.length > 0 ? (
            <div className="tabs-scroll-container">
              {displayCategories.map((category) => (
                <CategoryTab
                  key={category}
                  category={category}
                  isActive={activeCategory === category}
                  onClick={() => handleCategorySelect(category)}
                />
              ))}
              {isMobile && categories && categories.length > 6 && (
                <button
                  className="category-tab show-more-btn"
                  onClick={() => setShowAllCategories(!showAllCategories)}
                >
                  {showAllCategories ? "Show Less" : `+${categories.length - 6} More`}
                </button>
              )}
            </div>
          ) : (
            <div className="text-center py-3">No categories available</div>
          )}
        </div>
      )}
      {/* Only show the toggle button if sliding is possible */}
   {isMobile && categories && categories.length > 6 && (
  <button className="view-toggle-btn" onClick={toggleViewMode}>
    {showDropdown ? "📋 Show Tabs" : "📝 Show Dropdown"}
  </button>
      )}
    </div>
  </div>
</section>

			{/* Main Content */}
			<main className="main-content">
				<div className="container">
					{/* Top Selling Section */}
					<section className="mb-5">
						<div className="section-header">
							<h2 className="section-title">Top Selling</h2>
							<button className="view-all-btn">View All →</button>
						</div>
						{topSellingBooks && topSellingBooks.length > 0 ? (
							<div className="horizontal-scroll-container">
								<div className="horizontal-scroll">
									{topSellingBooks.map((book) => (
										<div key={book.id} className="book-scroll-item">
											<BookCard
												book={book}
												currency={userCurrency}
												onBookClick={handleBookClick} // Add this line
												onBuyNow={handleBuyNow}
												onAddToCart={handleAddToCart}
											/>
										</div>
									))}
								</div>
							</div>
						) : (
							<div className="text-center py-5">No top selling books available</div>
						)}
					</section>

					{/* Newly Released Section */}
					<section className="mb-5">
						<div className="section-header">
							<h2 className="section-title">Newly Released</h2>
							<button className="view-all-btn">View All →</button>
						</div>
						{newlyReleasedBooks && newlyReleasedBooks.length > 0 ? (
							<div className="horizontal-scroll-container">
								<div className="horizontal-scroll">
									{newlyReleasedBooks.map((book) => (
										<div key={book.id} className="book-scroll-item">
											<BookCard
												book={book}
												currency={userCurrency}
												onBookClick={handleBookClick} // Add this line
												onBuyNow={handleBuyNow}
												onAddToCart={handleAddToCart}
											/>
										</div>
									))}
								</div>
							</div>
						) : (
							<div className="text-center py-5">No newly released books available</div>
						)}
					</section>

					{/* Category-specific content section */}
					{activeCategory && activeCategory !== "Popular" && (
						<section className="mb-5">
							<div className="section-header">
								<h2 className="section-title">{activeCategory} Books</h2>
								<button className="view-all-btn">View All →</button>
							</div>
							<div className="text-center py-5">
								<p>Books for {activeCategory} category will be displayed here</p>
								<small className="text-muted">Integrate with your category-specific API endpoint</small>
							</div>
						</section>
					)}
				</div>
			</main>

			{/* Auth Modal */}
			<AuthModal isOpen={authModal.show} onClose={closeAuthModal} isSignUp={authModal.isSignUp} setIsSignUp={toggleSignUpMode} />
		</div>
	);
};

export default HomePage;
