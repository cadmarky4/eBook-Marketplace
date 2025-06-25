"use client";

import React, { useState } from "react";
import Image from "next/image";

import {formatPrice} from "@/components/layouts/Header";

export const BookCard = React.memo(({ book, currency, viewMode = "grid", onBookClick, onBuyNow, onAddToCart }) => {
	const [imageError, setImageError] = useState(false);

	// Handle image error with React state instead of DOM manipulation
	const handleImageError = () => {
		setImageError(true);
	};

	// List view mode
	if (viewMode === "list") {
		return (
			<div className="book-card-list" onClick={() => onBookClick?.(book)}>
				<div className="book-cover-small">
					{book.cover && book.cover !== "COVER" && !imageError ? (
						<Image
							src={`http://localhost:4000${book.cover.startsWith("/") ? book.cover : `/${book.cover}`}`}
							alt={`${book.title} cover`}
							className="book-cover-image-small"
							width={80}
							height={120}
							onError={handleImageError}
							style={{ objectFit: "cover" }}
						/>
					) : (
						<div className="book-cover-placeholder-small">
							<span>COVER</span>
						</div>
					)}
				</div>
				<div className="book-info-list">
					<div className="book-main-info">
						<h6 className="book-title-list">{book.title}</h6>
						<p className="book-author-list">{book.author}</p>
						<p className="book-description-list">{book.description || "Description / Synopsis"}</p>
					</div>
					<div className="book-meta-list">
						{book.price && <span className="book-price-list">{formatPrice(book.price, currency)}</span>}
						{book.rating && (
							<div className="book-rating-list">
								<span className="star">★</span>
								<span className="rating-value">{book.rating}</span>
							</div>
						)}
						<div className="book-category-list">{book.category}</div>
					</div>
				</div>
			</div>
		);
	}

	// Grid view mode with two-tone design
	return (
		<div className="book-card-modern" onClick={() => onBookClick?.(book)}>
			{/* Top Section - Cover Area */}
			<div className="book-cover-section">
				{book.cover && book.cover !== "COVER" && !imageError ? (
					<div className="book-image-container">
						<Image
							src={`http://localhost:4000${book.cover.startsWith("/") ? book.cover : `/${book.cover}`}`}
							alt={`${book.title} cover`}
							className="book-cover-image-modern"
							fill
							sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
							style={{ objectFit: "cover" }}
							onError={handleImageError}
						/>
					</div>
				) : (
					<div className="book-cover-placeholder-modern">
						<h3 className="book-title-cover">{book.title}</h3>
					</div>
				)}
			</div>

			{/* Bottom Section - Info Area */}
			<div className="book-info-section">
				<div className="book-details">
					<h6 className="book-title-modern">{book.title}</h6>
					<p className="book-author-modern">{book.author}</p>

					<div className="price-rating-modern">
						{book.price && <span className="price-modern">{formatPrice(book.price, currency)}</span>}
						{book.rating && (
							<div className="rating-modern">
								<span className="star-modern">★</span>
								<span>{book.rating}</span>
							</div>
						)}
					</div>

					{book.category && <div className="category-modern">{book.category}</div>}

					<div className="book-actions-modern">
						<button
							className="btn-preview-modern"
							onClick={(e) => {
								e.stopPropagation();
								// Handle preview
							}}
						>
							Preview
						</button>
						<button
							className="btn-buy-cart-modern"
							onClick={(e) => {
								e.stopPropagation();
								if (onBuyNow) {
									onBuyNow(book);
								} else if (onAddToCart) {
									onAddToCart(book);
								}
							}}
							aria-label="Buy now"
						>
							🛒
						</button>
					</div>
				</div>
			</div>
		</div>
	);
});

BookCard.displayName = "BookCard";
