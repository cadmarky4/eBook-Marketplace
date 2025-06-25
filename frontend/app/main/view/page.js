"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import styles from "./page.module.css";

// BookView component that accepts bookId as a prop
export default function BookView({ bookId, onBack, onAddToCart, onSubscribe }) {
	const [book, setBook] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		if (!bookId) {
			setError("Book ID is required");
			setLoading(false);
			return;
		}

		const fetchBookDetails = async () => {
			try {
				const response = await fetch(`/api/books/${bookId}`);

				if (!response.ok) {
					throw new Error("Failed to fetch book details");
				}

				const data = await response.json();
				setBook(data);
			} catch (err) {
				setError(err.message);
			} finally {
				setLoading(false);
			}
		};

		fetchBookDetails();
	}, [bookId]);

	const handleAddToCart = () => {
		if (onAddToCart) {
			onAddToCart(bookId);
		}
	};

	const handleSubscribe = () => {
		if (onSubscribe) {
			onSubscribe(bookId);
		}
	};

	const renderRatingStars = (rating) => {
		const stars = [];
		const fullStars = Math.floor(rating);
		const hasHalfStar = rating % 1 !== 0;

		for (let i = 0; i < 5; i++) {
			if (i < fullStars) {
				stars.push(
					<span key={i} className={styles.fullStar}>
						★
					</span>
				);
			} else if (i === fullStars && hasHalfStar) {
				stars.push(
					<span key={i} className={styles.halfStar}>
						★
					</span>
				);
			} else {
				stars.push(
					<span key={i} className={styles.emptyStar}>
						☆
					</span>
				);
			}
		}

		return stars;
	};

	if (loading) return <div className={styles.loading}>Loading...</div>;
	if (error) return <div className={styles.error}>{error}</div>;
	if (!book) return <div className={styles.error}>Book not found</div>;

	return (
		<div className={styles.container}>
			{/* Header */}
			<div className={styles.header}>
				<button className={styles.backButton} onClick={onBack} aria-label="Go back">
					←
				</button>
				<div className={styles.menuButton}>⋮</div>
			</div>

			{/* Book Content */}
			<div className={styles.content}>
				{/* Book Cover and Title Section */}
				<div className={styles.bookHeader}>
					<div className={styles.coverContainer}>
						{book.cover_image_url ? (
							<Image src={`http://localhost:4000${book.cover_image_url.startsWith("/") ? book.cover_image_url : `/${book.cover_image_url}`}`} alt={`Cover of ${book.title}`} className={styles.coverImage} width={150} height={210} />
						) : (
							<div className={styles.placeholderCover}>COVER</div>
						)}
					</div>

					<div className={styles.titleSection}>
						<h1 className={styles.bookTitle}>{book.title}</h1>
						<p className={styles.author}>{book.author?.name || "Unknown Author"}</p>

						<div className={styles.rating}>
							{renderRatingStars(book.rating || 3)}
							<span className={styles.ratingCount}>({book.ratings_count || 0} ratings)</span>
						</div>

						<div className={styles.basicInfo}>
							<div className={styles.infoRow}>
								<span className={styles.infoLabel}>Number</span>
								<span className={styles.infoValue}>{book.id || "N/A"}</span>
							</div>
							<div className={styles.infoRow}>
								<span className={styles.infoLabel}>Year</span>
								<span className={styles.infoValue}>{new Date(book.publication_date).getFullYear() || "N/A"}</span>
							</div>
							<div className={styles.infoRow}>
								<span className={styles.infoLabel}>Language</span>
								<span className={styles.infoValue}>{book.language || "English"}</span>
							</div>
						</div>
					</div>
				</div>

				{/* Book Details */}
				<div className={styles.detailsContainer}>
					<div className={styles.detailRow}>
						<span className={styles.detailLabel}>Category</span>
						<span className={styles.detailValue}>{book.category || "Uncategorized"}</span>
					</div>

					<div className={styles.detailRow}>
						<span className={styles.detailLabel}>Author</span>
						<span className={styles.detailValue}>{book.author?.name || "Unknown Author"}</span>
					</div>

					<div className={styles.detailRow}>
						<span className={styles.detailLabel}>ISBN</span>
						<span className={styles.detailValue}>{book.isbn || "N/A"}</span>
					</div>

					<div className={styles.detailRow}>
						<span className={styles.detailLabel}>Publisher</span>
						<span className={styles.detailValue}>{book.publisher?.name || "Unknown Publisher"}</span>
					</div>
				</div>

				{/* Tags */}
				<div className={styles.tagsContainer}>
					<span className={styles.tagsLabel}>Tags:</span>
					<div className={styles.tags}>
						{book.keywords?.map((tag, index) => (
							<span key={index} className={styles.tag}>
								{tag}
							</span>
						)) || <span className={styles.tag}>No tags</span>}
					</div>
				</div>

				{/* Action Buttons */}
				<div className={styles.actionButtons}>
					<button className={styles.subscribeButton} onClick={handleSubscribe}>
						Subscribe to Read
					</button>

					<button className={styles.cartButton} onClick={handleAddToCart}>
						Add to Cart
					</button>
				</div>
			</div>
		</div>
	);
}

// Also add CSS styles to a separate module file
