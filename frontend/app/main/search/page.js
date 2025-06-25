"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, X, Menu, ChevronDown, Grid, List, Bell, ShoppingCart, Home, Bookmark, User, Settings, Sliders, Tune, SlidersHorizontal, Filter } from "lucide-react";
import Image from "next/image";

import { formatPrice, detectUserCurrency } from "@/components/layouts/Header.js";
import AuthModal from "@/components/features/AuthModal.js";
import BookView from "../view/page"; // Import the BookView component

// Enhanced Mobile-Friendly Book Card Component
const SearchBookCard = ({ book, currency, viewMode, onBookClick, onBuyNow, onAddToCart, isMobile }) => {
	const [imageError, setImageError] = useState(false);

	const handleImageError = () => {
		setImageError(true);
	};

	// Mobile-optimized card layout
	if (isMobile || viewMode === "list") {
		return (
			<article className="search-book-card search-book-card--mobile" onClick={() => onBookClick?.(book)}>
				<div className="book-cover book-cover--mobile">
					{book.cover && book.cover !== "COVER" && !imageError ? (
						<Image
							src={`http://localhost:4000${book.cover.startsWith("/") ? book.cover : `/${book.cover}`}`}
							alt={`${book.title} cover`}
							className="book-cover-image"
							width={isMobile ? 120 : 100}
							height={isMobile ? 180 : 150}
							onError={handleImageError}
							loading="lazy"
							sizes="(max-width: 768px) 120px, 100px"
						/>
					) : (
						<div className="book-cover-placeholder book-cover-placeholder--mobile">
							<span className="cover-text">{book.title}</span>
						</div>
					)}
				</div>
				<div className="book-info book-info--mobile">
					<div className="book-main-info">
						<h3 className="book-title book-title--mobile">{book.title}</h3>
						<p className="book-author book-author--mobile">{book.author}</p>
						<p className="book-description book-description--mobile">{book.description || "Description / Synopsis"}</p>
					</div>
					<div className="book-meta book-meta--mobile">
						{book.price && <span className="book-price book-price--mobile">{formatPrice(book.price, currency)}</span>}
						{book.rating && (
							<div className="book-rating book-rating--mobile">
								<span className="star" aria-label="Rating">
									★
								</span>
								<span className="rating-value">{book.rating}</span>
							</div>
						)}
						{book.category && <div className="book-category book-category--mobile">{book.category}</div>}
					</div>
					<div className="book-actions book-actions--mobile">
						<button
							className="btn-preview btn-preview--mobile"
							onClick={(e) => {
								e.stopPropagation();
								// Handle preview
							}}
							aria-label={`Preview ${book.title}`}
						>
							Preview
						</button>
						<button
							className="btn-cart btn-cart--mobile"
							onClick={(e) => {
								e.stopPropagation();
								onBuyNow?.(book);
							}}
							aria-label={`Add ${book.title} to cart`}
						>
							<ShoppingCart size={16} />
						</button>
					</div>
				</div>
			</article>
		);
	}

	// Desktop grid view with enhanced responsive design
	return (
		<article className="search-book-card search-book-card--grid" onClick={() => onBookClick?.(book)}>
			{/* Cover Section */}
			<div className="book-cover-section">
				{book.cover && book.cover !== "COVER" && !imageError ? (
					<Image
						src={`http://localhost:4000${book.cover.startsWith("/") ? book.cover : `/${book.cover}`}`}
						alt={`${book.title} cover`}
						className="book-cover-image"
						width={280}
						height={240}
						onError={handleImageError}
						loading="lazy"
						sizes="(max-width: 1024px) 200px, 280px"
					/>
				) : (
					<div className="book-cover-placeholder-grid">
						<h3 className="book-title-cover">{book.title}</h3>
					</div>
				)}
			</div>

			{/* Info Section */}
			<div className="book-info-section">
				<div className="book-details">
					<h3 className="book-title-grid">{book.title}</h3>
					<p className="book-author-grid">{book.author}</p>
					<div className="book-meta-grid">
						{book.price && <span className="book-price-grid">{formatPrice(book.price, currency)}</span>}
						{book.rating && (
							<div className="book-rating-grid">
								<span className="star" aria-label="Rating">
									★
								</span>
								<span className="rating-value">{book.rating}</span>
							</div>
						)}
					</div>
					{book.category && <div className="book-category-grid">{book.category}</div>}

					{/* Action Buttons */}
					<div className="book-actions-grid">
						<button
							className="btn-preview-grid"
							onClick={(e) => {
								e.stopPropagation();
								// Handle preview
							}}
							aria-label={`Preview ${book.title}`}
						>
							Preview
						</button>
						<button
							className="btn-cart-grid"
							onClick={(e) => {
								e.stopPropagation();
								onBuyNow?.(book);
							}}
							aria-label={`Add ${book.title} to cart`}
						>
							<ShoppingCart size={16} />
						</button>
					</div>
				</div>
			</div>
		</article>
	);
};

// Enhanced Main Search Page Component
const SearchPage = () => {
	// Add state for BookView component
	const [selectedBookId, setSelectedBookId] = useState(null);
	const [isViewingBook, setIsViewingBook] = useState(false);

	const [searchQuery, setSearchQuery] = useState("");
	const [selectedCategory, setSelectedCategory] = useState("All");
	const [sortBy, setSortBy] = useState("relevance");
	const [priceRange, setPriceRange] = useState({ min: 0, max: 2000 });
	const [viewMode, setViewMode] = useState("grid");
	const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
	const [showMoreCategories, setShowMoreCategories] = useState(false);
	const [isMobile, setIsMobile] = useState(false);
	const [isTablet, setIsTablet] = useState(false);
	const [userCurrency, setUserCurrency] = useState("PHP");
	const [showAuthModal, setShowAuthModal] = useState(false);
	const [isSignUp, setIsSignUp] = useState(false);
	const [books, setBooks] = useState([]);
	const [filteredBooks, setFilteredBooks] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const [user, setUser] = useState({
		isAuthenticated: false,
		isPremium: false,
		name: null,
		email: null,
	});

	// Enhanced categories
	const categories = ["All", "Popular", "Fiction", "Non-Fiction", "Science", "Technology", "Mystery", "Romance", "History", "Biography", "Fantasy", "Business", "Education", "Health", "Self-Help", "Travel", "Cooking", "Art"];

	// Enhanced responsive detection
	useEffect(() => {
		if (typeof window !== "undefined") {
			const detectedCurrency = detectUserCurrency();
			setUserCurrency(detectedCurrency);

			const checkResponsive = () => {
				const width = window.innerWidth;
				const isMobileScreen = width < 768;
				const isTabletScreen = width >= 768 && width < 1024;
				const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;

				setIsMobile(isMobileScreen || (isTouchDevice && width < 768));
				setIsTablet(isTabletScreen);

				// Auto-adjust view mode based on screen size
				if (isMobileScreen) {
					setViewMode("list");
				} else if (isTabletScreen && viewMode === "list") {
					setViewMode("grid");
				}
			};

			checkResponsive();
			window.addEventListener("resize", checkResponsive);

			return () => window.removeEventListener("resize", checkResponsive);
		}
	}, [viewMode]);

	// Debounced search
	const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

	useEffect(() => {
		const fetchBooks = async () => {
			try {
				if (!searchQuery.trim()) {
					setBooks([]);
					setIsLoading(false);
					return;
				}

				const apiUrl = `api/books/search?query=${encodeURIComponent(searchQuery)}`;
				console.log("Fetching from:", apiUrl);

				const response = await fetch(apiUrl);

				if (!response.ok) {
					console.error("API error:", await response.text());
					setBooks([]);
					return;
				}

				const result = await response.json();

				if (result.success) {
					const transformedBooks = result.data.map((book) => ({
						id: book._id,
						title: book.title,

						price: book.price,
						rating: book.rating || 0,
						category: book.category,
						cover: book.cover_image_url,
						description: book.description,
						author: book.author.name,
					}));
					setBooks(transformedBooks);
				} else {
					console.error("API Error:", result.message);
					setBooks([]);
				}
			} catch (error) {
				console.error("Error fetching books:", error);
				setBooks([]);
			} finally {
				setIsLoading(false);
			}
		};

		fetchBooks();
	}, [debouncedSearchQuery, searchQuery]);

	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearchQuery(searchQuery);
		}, 300); // Reduced debounce time for better UX

		return () => clearTimeout(timer);
	}, [searchQuery]);

	// Enhanced search by category
	const searchByCategory = async (category) => {
		try {
			const response = await fetch(`api/books/category/${encodeURIComponent(category)}`);
			const result = await response.json();

			if (result.success) {
				const transformedBooks = result.data.map((book) => ({
					id: book._id,
					title: book.title,
					author: book.author.name,
					price: book.price,
					rating: book.rating,
					category: book.category,
					cover: book.cover_image_url,
					description: book.description,
				}));
				setBooks(transformedBooks);
			}
		} catch (error) {
			console.error("Error searching by category:", error);
		} finally {
			setIsLoading(false);
		}
	};

	// Enhanced search by author
	const searchByAuthor = async (authorName) => {
		try {
			const response = await fetch(`http://localhost:4000/api/books/search/author?authorName=${encodeURIComponent(authorName)}`);
			const result = await response.json();

			if (result.success) {
				const transformedBooks = result.data.map((book) => ({
					id: book._id,
					title: book.title,
					author: book.author.name,
					price: book.price,
					rating: book.rating,
					category: book.category,
					cover: book.cover_image_url,
					description: book.description,
				}));
				setBooks(transformedBooks);
			}
		} catch (error) {
			console.error("Error searching by author:", error);
		} finally {
			setIsLoading(false);
		}
	};

	// Enhanced filter and sort books
	useEffect(() => {
		let filtered = books.filter((book) => {
			const matchesQuery =
				searchQuery === "" ||
				book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
				book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
				(book.description && book.description.toLowerCase().includes(searchQuery.toLowerCase()));

			const matchesCategory = selectedCategory === "All" || book.category === selectedCategory;
			const matchesPrice = book.price >= priceRange.min && book.price <= priceRange.max;

			return matchesQuery && matchesCategory && matchesPrice;
		});

		// Enhanced sorting
		filtered.sort((a, b) => {
			switch (sortBy) {
				case "price-low":
					return a.price - b.price;
				case "price-high":
					return b.price - a.price;
				case "rating":
					return b.rating - a.rating;
				case "title":
					return a.title.localeCompare(b.title);
				case "author":
					return a.author.localeCompare(b.author);
				default:
					return 0;
			}
		});

		setFilteredBooks(filtered);
	}, [books, searchQuery, selectedCategory, sortBy, priceRange]);

	// Authentication handlers
	const requireAuth = (action) => {
		if (!user?.isAuthenticated) {
			setShowAuthModal(true);
			return false;
		}
		return true;
	};

	const handleBuyNow = (book) => {
		if (requireAuth("purchase")) {
			console.log("Proceeding with purchase for:", book.title);
		}
	};

	const handleAddToCart = (book) => {
		if (requireAuth("cart")) {
			console.log("Adding to cart:", book.title);
		}
	};

	// Updated to set the selected book ID and show the book view
	const handleBookClick = (book) => {
		console.log("Viewing book:", book.title);
		setSelectedBookId(book.id);
		setIsViewingBook(true);
	};

	// Handle back button from book view
	const handleBackFromBookView = () => {
		setIsViewingBook(false);
		setSelectedBookId(null);
	};

	const handleSearch = (e) => {
		e.preventDefault();
		// Search is handled by useEffect
	};

	const handleCategoryChange = (category) => {
		setSelectedCategory(category);

		if (category === "All") {
			setSearchQuery("");
			setDebouncedSearchQuery("");
		} else {
			searchByCategory(category);
		}
	};

	const [authorSearchQuery, setAuthorSearchQuery] = useState("");

	const handleAuthorSearch = (e) => {
		e.preventDefault();
		if (authorSearchQuery.trim()) {
			searchByAuthor(authorSearchQuery);
		}
	};

	const clearSearch = () => {
		setSearchQuery("");
		setSelectedCategory("All");
	};

	const handleViewModeChange = (mode) => {
		setViewMode(mode);
	};

	// Show BookView when a book is selected
	if (isViewingBook && selectedBookId) {
		return (
			<BookView
				bookId={selectedBookId}
				onBack={handleBackFromBookView}
				onAddToCart={(bookId) => {
					if (requireAuth("cart")) {
						console.log("Adding to cart:", bookId);
					}
				}}
				onSubscribe={(bookId) => {
					if (requireAuth("subscription")) {
						console.log("Subscribing to book:", bookId);
					}
				}}
			/>
		);
	}

	// Enhanced loading state
	if (isLoading) {
		return (
			<div className="search-container">
				<div className="loading-container">
					<div className="spinner" role="status" aria-label="Loading search results">
						<span className="visually-hidden">Loading...</span>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="search-container">
			{/* Enhanced Search Section */}
			<section className="search-section" role="search">
				<div className="search-content">
					<div className="search-bar-container">
						<form onSubmit={handleSearch} className="w-100" role="search">
							<div className="search-input-wrapper">
								<Search size={isMobile ? 18 : 20} className="search-icon" aria-hidden="true" />
								<input
									type="text"
									className="search-input"
									placeholder={isMobile ? "  Search books..." : "   Search books, authors, or keywords..."}
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									aria-label="Search books"
								/>
								{searchQuery && (
									<button type="button" className="search-clear-btn" onClick={() => setSearchQuery("")} aria-label="Clear search">
										<X size={16} />
									</button>
								)}
							</div>
						</form>
					</div>

					{/* Enhanced Filter Section with Separate Controls */}
					<div className="search-filters">
						<div className="filter-header">
							<div className="filter-label">
								<span>Categories</span>
								{filteredBooks.length > 0 && <span className="results-count">({filteredBooks.length})</span>}
							</div>
							{isMobile && (
								<div className="filter-toggle-container">
									<button className="filter-toggle-btn" onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} aria-label="Toggle advanced filters" aria-expanded={showAdvancedFilters}>
										{/* Modern filter icon alternatives */}
										<SlidersHorizontal size={16} className="filter-icon" />
										<span className="filter-text">{showAdvancedFilters ? "Less" : "Filters"}</span>
									</button>
								</div>
							)}
						</div>

						{/* Categories Section */}
						<div className="category-filters-container">
							<div className="category-buttons-container">
								<div className="category-buttons">
									{/* Show limited categories on mobile, or all if showMoreCategories is true */}
									{categories.slice(0, isMobile && !showMoreCategories ? 6 : categories.length).map((category) => (
										<button key={category} className={`category-btn ${selectedCategory === category ? "active" : ""}`} onClick={() => handleCategoryChange(category)} aria-pressed={selectedCategory === category}>
											{category}
										</button>
									))}
									{/* Show "Show More" button on mobile when there are more than 6 categories */}
									{isMobile && !showMoreCategories && categories.length > 6 && (
										<button className="category-btn category-btn--more" onClick={() => setShowMoreCategories(true)} aria-label={`Show ${categories.length - 6} more categories`}>
											+{categories.length - 6}
										</button>
									)}
									{/* Show "Show Less" button when categories are expanded */}
									{isMobile && showMoreCategories && (
										<button className="category-btn category-btn--less" onClick={() => setShowMoreCategories(false)} aria-label="Show fewer categories">
											Show Less
										</button>
									)}
								</div>
							</div>
						</div>

						{/* Advanced Filters Section - Separate from Categories */}
						{(!isMobile || showAdvancedFilters) && (
							<div className="advanced-filters">
								<div className="price-range">
									<h3>Price Range</h3>
									<div className="price-range-controls">
										<input type="range" min="0" max="2000" step="50" value={priceRange.max} onChange={(e) => setPriceRange({ ...priceRange, max: parseInt(e.target.value) })} className="price-slider" aria-label="Maximum price" />
										<span className="price-display">{formatPrice(priceRange.max, userCurrency)}</span>
									</div>
								</div>

								{/* Sort Options */}
								<div className="sort-options">
									<h3>Sort By</h3>
									<select className="sort-select-advanced" value={sortBy} onChange={(e) => setSortBy(e.target.value)} aria-label="Sort results by">
										<option value="relevance">Relevance</option>
										<option value="price-low">Price: Low to High</option>
										<option value="price-high">Price: High to Low</option>
										<option value="rating">Rating</option>
										<option value="title">Title</option>
										<option value="author">Author</option>
									</select>
								</div>
							</div>
						)}
					</div>
				</div>
			</section>

			{/* Enhanced Results Section */}
			<section className="results-section" role="main">
				<div className="results-content">
					<div className="results-header">
						<div className="results-info">
							<h1 className="results-title">
								{isMobile ? "Results" : "Search Results"}
								<span className="results-count">({filteredBooks.length})</span>
							</h1>
							{searchQuery && !isMobile && (
								<p className="results-query-text">
									Showing results for <span className="results-query">{`"${searchQuery}"`}</span>
								</p>
							)}
						</div>

						<div className="results-controls">
							{!isMobile && (
								<div className="view-toggles">
									<button className={`view-toggle ${viewMode === "grid" ? "active" : ""}`} onClick={() => handleViewModeChange("grid")} aria-label="Grid view" aria-pressed={viewMode === "grid"}>
										<Grid size={18} />
									</button>
									<button className={`view-toggle ${viewMode === "list" ? "active" : ""}`} onClick={() => handleViewModeChange("list")} aria-label="List view" aria-pressed={viewMode === "list"}>
										<List size={18} />
									</button>
								</div>
							)}

							<select className="sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)} aria-label="Sort results">
								<option value="relevance">Relevance</option>
								<option value="price-low">Price: Low to High</option>
								<option value="price-high">Price: High to Low</option>
								<option value="rating">Rating</option>
								<option value="title">Title</option>
								<option value="author">Author</option>
							</select>
						</div>
					</div>

					{filteredBooks.length > 0 ? (
						<div className={`results-container ${isMobile ? "results-container--mobile" : ""} ${viewMode === "grid" && !isMobile ? "results-grid" : "results-list"}`}>
							{filteredBooks.map((book) => (
								<SearchBookCard key={book.id} book={book} currency={userCurrency} viewMode={viewMode} onBookClick={handleBookClick} onBuyNow={handleBuyNow} onAddToCart={handleAddToCart} isMobile={isMobile} />
							))}
						</div>
					) : (
						<div className="no-results">
							<div className="no-results-icon">
								<Search size={isMobile ? 32 : 48} />
							</div>
							<h2 className="no-results-title">No books found</h2>
							<p className="no-results-text">Try adjusting your search or filters</p>
							{searchQuery && (
								<button className="btn-clear-search" onClick={clearSearch}>
									Clear Search
								</button>
							)}
						</div>
					)}
				</div>
			</section>

			{/* Auth Modal */}
			<AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} isSignUp={isSignUp} setIsSignUp={setIsSignUp} />
		</div>
	);
};

export default SearchPage;
