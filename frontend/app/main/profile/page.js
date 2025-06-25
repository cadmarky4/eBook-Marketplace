"use client";
import React, { useState, useEffect } from "react";
import "./profile.css";
import { useAuth } from "@/components/layouts/AuthContext";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
	const { user, loading } = useAuth();
	const router = useRouter();

	const [profileData, setProfileData] = useState({
		name: "",
		bio: "This user is lazy and doesn't have a Bio",
		avatar: null,
	});
	const [genres, setGenres] = useState([]);
	const [readingList, setReadingList] = useState([]);
	const [following, setFollowing] = useState([]);
	const [recentInteraction, setRecentInteraction] = useState(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState(null);

	// Fetch user profile data when component mounts
	useEffect(() => {
		// Wait for auth context to load
		if (loading) return;

		// If no user is logged in, redirect to auth
		if (!user) {
			router.push("/auth");
			return;
		}

		// Start loading data
		const fetchProfileData = async () => {
			try {
				setIsLoading(true);

				// Use the current user's basic info
				setProfileData({
					name: user.fullName || user.name || user.username || "User",
					bio: "This user hasn't set a bio yet",
					avatar: user.avatar || "https://i.imgur.com/8b2C1a1.png",
				});

				// Fetch wishlist (reading list)
				const token = localStorage.getItem("authToken");
				if (!token) throw new Error("No authentication token found");

				const wishlistResponse = await fetch("/api/user/wishlist", {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				});

				if (wishlistResponse.ok) {
					const wishlistData = await wishlistResponse.json();
					if (wishlistData.success) {
						// Format books for display
						const formattedBooks = wishlistData.wishlist.map((book) => ({
							id: book._id,
							title: book.title,
							author: book.author?.name || "Unknown Author",
							cover: book.cover_image_url || null,
						}));
						setReadingList(formattedBooks);
					}
				}

				// Fetch user's preferred genres
				// Assuming you have an endpoint like /api/user/preferences
				const preferencesResponse = await fetch("/api/user/preferences", {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				});

				if (preferencesResponse.ok) {
					const preferencesData = await preferencesResponse.json();
					if (preferencesData.preferences?.genres) {
						setGenres(preferencesData.preferences.genres);
					} else {
						// Default genres if none are set
						setGenres(["Fiction", "Non-Fiction", "Education"]);
					}
				}

				// Fetch user's recently interacted book
				const recentBooksResponse = await fetch("/api/user/recent-books", {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				});

				if (recentBooksResponse.ok) {
					const recentBooksData = await recentBooksResponse.json();
					if (recentBooksData.books && recentBooksData.books.length > 0) {
						setRecentInteraction({
							title: recentBooksData.books[0].title,
							author: recentBooksData.books[0].author?.name || "Unknown Author",
							synopsis: recentBooksData.books[0].description || "No description available",
							cover: recentBooksData.books[0].cover_image_url || null,
						});
					}
				}

				// Fetch following list
				const followingResponse = await fetch("/api/user/following", {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				});

				if (followingResponse.ok) {
					const followingData = await followingResponse.json();
					if (followingData.success && followingData.following) {
						setFollowing(
							followingData.following.map((follow) => ({
								id: follow._id,
								name: follow.name || follow.fullName,
								avatar: follow.avatar,
							}))
						);
					}
				}
			} catch (err) {
				console.error("Error fetching profile data:", err);
				setError("Failed to load profile data. Please try again later.");
			} finally {
				setIsLoading(false);
			}
		};

		fetchProfileData();
	}, [user, loading, router]);

	// Handle publisher signup
	const handlePublisherSignup = () => {
		router.push("publisher/upgrade/publisher");
	};

	// Loading state
	if (loading || isLoading) {
		return (
			<div className="profile-container loading">
				<div className="loading-spinner"></div>
				<p>Loading profile data...</p>
			</div>
		);
	}

	// Error state
	if (error) {
		return (
			<div className="profile-container error">
				<p className="error-message">{error}</p>
				<button className="retry-button" onClick={() => window.location.reload()}>
					Retry
				</button>
			</div>
		);
	}

	return (
		<div className="profile-container">
			<div className="profile-layout">
				{/* Left Column */}
				<div className="profile-left-column">
					<div className="profile-card">
						<img src={profileData.avatar} alt="User Avatar" className="profile-image" />
						<h1 className="profile-name">{profileData.name}</h1>
						<p className="profile-bio">{profileData.bio}</p>
						<button className="edit-profile-button">Edit Profile</button>
					</div>

					<div className="profile-section">
						<h2 className="profile-section-title">Genres</h2>
						<div className="genres-container">
							{genres.length > 0 ? (
								genres.map((genre) => (
									<a href="#" key={genre} className="genre-pill">
										{genre}
									</a>
								))
							) : (
								<p className="no-data-message">No preferred genres set</p>
							)}
						</div>
					</div>

					<div className="profile-section">
						<h2 className="profile-section-title">Reading List / Bookshelves</h2>
						<div className="bookshelf">
							{readingList.length > 0 ? (
								readingList.map((book) => (
									<a href={`/main/book/${book.id}`} key={book.id} className="clickable-wrapper-link">
										<div className="book-item">
											<div className="book-cover">{book.cover ? <img src={book.cover} alt={book.title} /> : "COVER"}</div>
											<div className="book-title">{book.title}</div>
											<div className="book-author">{book.author}</div>
										</div>
									</a>
								))
							) : (
								<p className="no-data-message">Your reading list is empty</p>
							)}
						</div>
					</div>
				</div>

				{/* Right Column */}
				<div className="profile-right-column">
					{recentInteraction && (
						<div className="profile-section">
							<h2 className="profile-section-title">Recent Interaction</h2>
							<a href="#" className="clickable-wrapper-link">
								<div className="recent-interaction-card">
									<div className="recent-book-cover">{recentInteraction.cover ? <img src={recentInteraction.cover} alt={recentInteraction.title} /> : "COVER"}</div>
									<div className="recent-book-info">
										<h3 className="recent-book-title">{recentInteraction.title}</h3>
										<p className="recent-book-author">by {recentInteraction.author}</p>
										<p className="recent-book-synopsis">{recentInteraction.synopsis}</p>
									</div>
								</div>
							</a>
						</div>
					)}

					<div className="profile-section">
						<h2 className="profile-section-title">Following</h2>
						<div className="following-list">
							{following.length > 0 ? (
								following.map((followedUser) => (
									<a href={`/main/author/${followedUser.id}`} key={followedUser.id} className="clickable-wrapper-link">
										<div className="followed-user">
											<div className="followed-user-avatar">{followedUser.avatar ? <img src={followedUser.avatar} alt={followedUser.name} /> : ""}</div>
											<p className="followed-user-name">{followedUser.name}</p>
										</div>
									</a>
								))
							) : (
								<p className="no-data-message">You're not following anyone yet</p>
							)}
						</div>
					</div>

					{/* Show publisher CTA only if user is not already a publisher */}
					{user && !user.accountType?.includes("Publisher") && (
						<div className="publisher-cta-card">
							<h2 className="publisher-cta-title">Want to be a Publisher?</h2>
							<button className="publisher-cta-button" onClick={handlePublisherSignup}>
								Sign Up as Publisher
							</button>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
