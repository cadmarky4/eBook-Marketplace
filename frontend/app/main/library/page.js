"use client";

import React, { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { Filter, X, ChevronDown, ChevronUp } from "lucide-react";
import "./library.css";

// Expanded mock data for purchased books
const initialBooks = [
	{
		id: 1,
		title: "The Great Adventure",
		author: "John Smith",
		cover: "/images/covers/cover1.jpg",
		description: "An epic tale of discovery and courage.",
		downloadLimit: 3,
		downloadsLeft: 2,
		progress: 0.35, // 35% read
		file: "/uploads/books/1750123107389-751511823.epub",
		category: "Fiction",
		genre: "Adventure",
		rating: 4.5,
		dateAdded: "2024-01-15",
	},
	{
		id: 2,
		title: "Mystery of Time",
		author: "Jane Doe",
		cover: "/images/covers/cover2.jpg",
		description: "A thrilling mystery that will keep you guessing.",
		downloadLimit: 5,
		downloadsLeft: 5,
		progress: 0.0,
		file: "/uploads/books/1750144385895-261018228.epub",
		category: "Fiction",
		genre: "Mystery",
		rating: 4.2,
		dateAdded: "2024-01-20",
	},
	{
		id: 3,
		title: "Science Today",
		author: "Dr. Brown",
		cover: "/images/covers/cover3.jpg",
		description: "Exploring the frontiers of modern science.",
		downloadLimit: 2,
		downloadsLeft: 1,
		progress: 0.7,
		file: "/uploads/books/1750145118076-575973025.epub",
		category: "Non-Fiction",
		genre: "Science",
		rating: 4.8,
		dateAdded: "2024-01-10",
	},
	{
		id: 4,
		title: "Ocean Mysteries",
		author: "Marine Expert",
		cover: "/images/covers/cover4.jpg",
		description: "Dive deep into the secrets of our oceans.",
		downloadLimit: 4,
		downloadsLeft: 4,
		progress: 0.15,
		file: "/uploads/books/1750145442187-966743189.epub",
		category: "Non-Fiction",
		genre: "Nature",
		rating: 4.0,
		dateAdded: "2024-01-25",
	},
	{
		id: 5,
		title: "Digital Revolution",
		author: "Sarah Wilson",
		cover: "/images/covers/cover5.jpg",
		description: "How technology is reshaping our world.",
		downloadLimit: 3,
		downloadsLeft: 3,
		progress: 0.0,
		file: "/uploads/books/1750155515625-484778104.epub",
		category: "Non-Fiction",
		genre: "Technology",
		rating: 4.6,
		dateAdded: "2024-01-30",
	},
];

const LibraryBookCard = ({ book, onRead, onDownload }) => {
	const progressPercent = Math.round(book.progress * 100);

	return (
		<div className="library-book-card">
			<div className="library-book-cover-container">
				<Image src={book.cover} alt={book.title} width={180} height={270} className="library-book-cover" />
			</div>
			<div className="library-book-info">
				<h3 className="library-book-title">{book.title}</h3>
				<p className="library-book-author">by {book.author}</p>
				<div className="library-book-meta">
					<span className="library-book-category">{book.category}</span>
					<span className="library-book-genre">{book.genre}</span>
				</div>
				<div className="library-progress-bar-wrapper">
					<div className="library-progress-bar">
						<div className="library-progress-fill" style={{ width: `${progressPercent}%` }} />
					</div>
					<span className="library-progress-text">{progressPercent}%</span>
				</div>
				<div className="library-book-actions">
					<button
						className="library-btn library-btn-read"
						onClick={() => onRead(book)}
					>
						Read Now
					</button>
					<button
						className="library-btn library-btn-download-icon"
						onClick={(e) => {
							e.stopPropagation();
							onDownload(book.id);
						}}
						disabled={book.downloadsLeft === 0}
						title={`Download (${book.downloadsLeft}/${book.downloadLimit})`}
					>
						⬇️
					</button>
				</div>
			</div>
		</div>
	);
};

const LibraryFilter = ({ filters, onFilterChange, onClearFilters, isMobile, showFilters, setShowFilters }) => {
	const categories = ["All", "Fiction", "Non-Fiction"];
	const genres = ["All", "Adventure", "Mystery", "Science", "Nature", "Technology"];
	const progressRanges = [
		{ label: "All", value: "all" },
		{ label: "Not Started (0%)", value: "0" },
		{ label: "In Progress (1-50%)", value: "1-50" },
		{ label: "Almost Done (51-99%)", value: "51-99" },
		{ label: "Completed (100%)", value: "100" },
	];
	const sortOptions = [
		{ label: "Title A-Z", value: "title-asc" },
		{ label: "Title Z-A", value: "title-desc" },
		{ label: "Author A-Z", value: "author-asc" },
		{ label: "Author Z-A", value: "author-desc" },
		{ label: "Progress High-Low", value: "progress-desc" },
		{ label: "Progress Low-High", value: "progress-asc" },
		{ label: "Date Added (Newest)", value: "date-desc" },
		{ label: "Date Added (Oldest)", value: "date-asc" },
		{ label: "Rating High-Low", value: "rating-desc" },
	];

	const toggleFilters = () => {
		setShowFilters(!showFilters);
	};

	return (
		<div className="library-filter-container">
			<div className="library-filter-header">
				<h3 className="library-filter-title">Filter & Sort</h3>
				<div className="library-filter-actions">
					{isMobile && (
						<button className="library-filter-toggle-btn" onClick={toggleFilters}>
							<Filter size={16} />
							{showFilters ? "Less" : "More"}
						</button>
					)}
					<button className="library-filter-clear" onClick={onClearFilters}>
						Clear All
					</button>
				</div>
			</div>

			<div className={`library-filter-content ${showFilters ? "expanded" : ""}`}>
				{/* Search - Always visible */}
				<div className="library-filter-group library-filter-search">
					<label className="library-filter-label">Search</label>
					<input type="text" placeholder={isMobile ? "Search books..." : "Search by title, author, or description..."} value={filters.search} onChange={(e) => onFilterChange("search", e.target.value)} className="library-filter-input" />
				</div>

				{/* Mobile: Show limited filters by default, expand for more */}
				{(!isMobile || showFilters) && (
					<div className="library-filter-grid">
						{/* Category */}
						<div className="library-filter-group">
							<label className="library-filter-label">Category</label>
							<select value={filters.category} onChange={(e) => onFilterChange("category", e.target.value)} className="library-filter-select">
								{categories.map((category) => (
									<option key={category} value={category}>
										{category}
									</option>
								))}
							</select>
						</div>

						{/* Genre */}
						<div className="library-filter-group">
							<label className="library-filter-label">Genre</label>
							<select value={filters.genre} onChange={(e) => onFilterChange("genre", e.target.value)} className="library-filter-select">
								{genres.map((genre) => (
									<option key={genre} value={genre}>
										{genre}
									</option>
								))}
							</select>
						</div>

						{/* Progress */}
						<div className="library-filter-group">
							<label className="library-filter-label">Reading Progress</label>
							<select value={filters.progress} onChange={(e) => onFilterChange("progress", e.target.value)} className="library-filter-select">
								{progressRanges.map((range) => (
									<option key={range.value} value={range.value}>
										{range.label}
									</option>
								))}
							</select>
						</div>

						{/* Sort */}
						<div className="library-filter-group">
							<label className="library-filter-label">Sort By</label>
							<select value={filters.sort} onChange={(e) => onFilterChange("sort", e.target.value)} className="library-filter-select">
								{sortOptions.map((option) => (
									<option key={option.value} value={option.value}>
										{option.label}
									</option>
								))}
							</select>
						</div>
					</div>
				)}

				{/* Mobile: Show quick filter buttons when collapsed */}
				{isMobile && !showFilters && (
					<div className="library-quick-filters">
						<div className="library-quick-filter-buttons">
							<button className={`library-quick-filter-btn ${filters.category !== "All" ? "active" : ""}`} onClick={() => onFilterChange("category", filters.category === "All" ? "Fiction" : "All")}>
								{filters.category === "All" ? "All Categories" : filters.category}
							</button>
							<button className={`library-quick-filter-btn ${filters.progress !== "all" ? "active" : ""}`} onClick={() => onFilterChange("progress", filters.progress === "all" ? "0" : "all")}>
								{filters.progress === "all" ? "All Progress" : "Filtered"}
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default function LibraryPage() {
	const [books, setBooks] = useState(initialBooks);
	const [readerOpen, setReaderOpen] = useState(false);
	const [currentBook, setCurrentBook] = useState(null);
	const [isMobile, setIsMobile] = useState(false);
	const [showFilters, setShowFilters] = useState(false);
	const [filters, setFilters] = useState({
		search: "",
		category: "All",
		genre: "All",
		progress: "all",
		sort: "title-asc",
	});

	// Detect mobile device
	useEffect(() => {
		const checkMobile = () => {
			const isMobileScreen = window.innerWidth < 768;
			const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
			setIsMobile(isMobileScreen || isTouchDevice);
		};

		checkMobile();
		window.addEventListener("resize", checkMobile);
		return () => window.removeEventListener("resize", checkMobile);
	}, []);

	const handleReadOnline = (book) => {
		setCurrentBook(book);
		setReaderOpen(true);
	};

	const handleCloseReader = () => {
		setReaderOpen(false);
		setCurrentBook(null);
	};

	const handleDownload = (bookId) => {
		setBooks((books) => books.map((book) => (book.id === bookId && book.downloadsLeft > 0 ? { ...book, downloadsLeft: book.downloadsLeft - 1 } : book)));
		alert("Download started!");
	};

	const handleFilterChange = (filterType, value) => {
		setFilters((prev) => ({
			...prev,
			[filterType]: value,
		}));
	};

	const handleClearFilters = () => {
		setFilters({
			search: "",
			category: "All",
			genre: "All",
			progress: "all",
			sort: "title-asc",
		});
	};

	// Filter and sort books
	const filteredAndSortedBooks = useMemo(() => {
		let filtered = [...books];

		// Search filter
		if (filters.search) {
			const searchLower = filters.search.toLowerCase();
			filtered = filtered.filter((book) => book.title.toLowerCase().includes(searchLower) || book.author.toLowerCase().includes(searchLower) || book.description.toLowerCase().includes(searchLower));
		}

		// Category filter
		if (filters.category !== "All") {
			filtered = filtered.filter((book) => book.category === filters.category);
		}

		// Genre filter
		if (filters.genre !== "All") {
			filtered = filtered.filter((book) => book.genre === filters.genre);
		}

		// Progress filter
		if (filters.progress !== "all") {
			const progressPercent = Math.round(filters.progress * 100);
			switch (filters.progress) {
				case "0":
					filtered = filtered.filter((book) => Math.round(book.progress * 100) === 0);
					break;
				case "1-50":
					filtered = filtered.filter((book) => {
						const progress = Math.round(book.progress * 100);
						return progress > 0 && progress <= 50;
					});
					break;
				case "51-99":
					filtered = filtered.filter((book) => {
						const progress = Math.round(book.progress * 100);
						return progress > 50 && progress < 100;
					});
					break;
				case "100":
					filtered = filtered.filter((book) => Math.round(book.progress * 100) === 100);
					break;
				default:
					break;
			}
		}

		// Sort
		switch (filters.sort) {
			case "title-asc":
				filtered.sort((a, b) => a.title.localeCompare(b.title));
				break;
			case "title-desc":
				filtered.sort((a, b) => b.title.localeCompare(a.title));
				break;
			case "author-asc":
				filtered.sort((a, b) => a.author.localeCompare(b.author));
				break;
			case "author-desc":
				filtered.sort((a, b) => b.author.localeCompare(a.author));
				break;
			case "progress-desc":
				filtered.sort((a, b) => b.progress - a.progress);
				break;
			case "progress-asc":
				filtered.sort((a, b) => a.progress - b.progress);
				break;
			case "date-desc":
				filtered.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
				break;
			case "date-asc":
				filtered.sort((a, b) => new Date(a.dateAdded) - new Date(b.dateAdded));
				break;
			case "rating-desc":
				filtered.sort((a, b) => b.rating - a.rating);
				break;
			default:
				break;
		}

		return filtered;
	}, [books, filters]);

	return (
		<div className="library-container">
			<h1 className="library-page-title">My Library</h1>
			<p className="library-page-subtitle">All your purchased books in one place.</p>

			<LibraryFilter filters={filters} onFilterChange={handleFilterChange} onClearFilters={handleClearFilters} isMobile={isMobile} showFilters={showFilters} setShowFilters={setShowFilters} />

			<div className="library-results-info">
				<p className="library-results-count">
					Showing {filteredAndSortedBooks.length} of {books.length} books
				</p>
			</div>

			{filteredAndSortedBooks.length === 0 ? (
				<div className="library-empty-state">
					<div className="library-empty-icon">📚</div>
					<h3 className="library-empty-title">No books found</h3>
					<p className="library-empty-text">Try adjusting your filters or search terms to find what you&apos; looking for.</p>
					<button className="library-empty-btn" onClick={handleClearFilters}>
						Clear Filters
					</button>
				</div>
			) : (
				<div className="library-books-grid">
					{filteredAndSortedBooks.map((book) => (
						<LibraryBookCard key={book.id} book={book} onRead={handleReadOnline} onDownload={handleDownload} />
					))}
				</div>
			)}

			{readerOpen && currentBook && (
				<div className="library-reader-modal-overlay" onClick={handleCloseReader}>
					<div className="library-reader-mobile" onClick={e => e.stopPropagation()}>
						<div className="library-reader-mobile-header">
							<button className="library-reader-mobile-back" onClick={handleCloseReader} aria-label="Back">←</button>
							<span className="library-reader-mobile-title">{currentBook.title}</span>
						</div>
						<div className="library-reader-mobile-content">
							<h2 className="library-reader-mobile-chapter">Chapter 1: The Beginning</h2>
							<p className="library-reader-mobile-text">
								Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.
							</p>
							<p className="library-reader-mobile-text">
								Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
							</p>
						</div>
						<div className="library-reader-mobile-nav">
							<button className="library-reader-mobile-nav-btn">Previous</button>
							<span className="library-reader-mobile-page">1</span>
							<button className="library-reader-mobile-nav-btn primary">Next</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
