"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../../components/layouts/AuthContext";
import { useRouter } from "next/navigation";
import styles from "./UploadBook.module.css";

function UploadBook() {
	const { user } = useAuth();
	const router = useRouter();
	// Add publisherProfile state
	const [publisherProfile, setPublisherProfile] = useState(null);
	// Update the form state to include authorName
	const [form, setForm] = useState({
		title: "",
		category: "",
		description: "",
		price: "",
		keywords: "",
		authorName: "", // Add this field
		publication_date: new Date().toISOString(),
		file: null,
		coverImage: null,
	});
	const [success, setSuccess] = useState(false);
	const [errors, setErrors] = useState({});

	const handleChange = (e) => {
		const { name, value, files } = e.target;
		setForm((prev) => ({
			...prev,
			[name]: files ? files[0] : value,
		}));

		if (errors[name]) {
			setErrors((prev) => ({ ...prev, [name]: "" }));
		}
	};

	// Check if user is authorized to upload books
	// Replace the useEffect authorization check with this code

	useEffect(() => {

		if (user) {
			console.log("Account type:", user.accountType);

			// Check if accountType is an array or string and handle accordingly
			let isAuthorized = false;

			if (Array.isArray(user.accountType)) {
				// Case sensitive check
				isAuthorized = user.accountType.includes("publisher") || user.accountType.includes("Admin");
				console.log("Authorization check (array):", isAuthorized);
			} else {
				// Case sensitive check
				const accountType = user.accountType || user.role || user.userType || "";
				isAuthorized = accountType === "publisher" || accountType === "Admin";
				console.log("Authorization check (string):", isAuthorized);
			}
		}
	}, [user, router]);

	// Fetch publisher profile to get penName
	useEffect(() => {
		const fetchPublisherProfile = async () => {
			if (!user) return;
			// Only fetch if user is publisher or admin
			let isPublisher = false;
			if (Array.isArray(user.accountType)) {
				isPublisher = user.accountType.includes("publisher");
			} else {
				const accountType = user.accountType || user.role || user.userType || "";
				isPublisher = accountType.toLowerCase().includes("publisher");
			}
			if (!isPublisher) return;

			try {
				const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
				// Use the correct endpoint as defined in your backend
				const res = await fetch("/api/publisher/data", {
					headers: { Authorization: `Bearer ${token}` },
				});
				if (res.ok) {
					const data = await res.json();
					setPublisherProfile(data?.publisherData || null);
				}
			} catch (err) {
				console.error("Failed to fetch publisher profile:", err);
			}
		};
		fetchPublisherProfile();
		// eslint-disable-next-line
	}, [user]);

	const validateForm = () => {
		const newErrors = {};
		if (!form.title.trim()) newErrors.title = "Title is required";
		if (!form.category) newErrors.category = "Category is required";
		if (!form.description.trim()) newErrors.description = "Description is required";
		if (!form.price || form.price <= 0) newErrors.price = "Valid price is required";
		if (!form.file) newErrors.file = "Book file is required";

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const token = localStorage.getItem("token");

	const handleSubmit = async (e) => {
		e.preventDefault();

		// Get token from localStorage or sessionStorage
		const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");

		if (!token) {
			setErrors((prev) => ({
				...prev,
				submit: "Authentication required. Please log in again.",
			}));
			return;
		}
		// Check if user is logged in and authorized
		let isAuthorized = false;

		if (Array.isArray(user.accountType)) {
			// Case sensitive check
			isAuthorized = user.accountType.includes("publisher") || user.accountType.includes("Admin");
		} else {
			// Case sensitive check
			const accountType = user.accountType || user.role || user.userType || "";
			isAuthorized = accountType === "publisher" || accountType === "Admin";
		}

		if (validateForm()) {
			try {
				// Create FormData object to send files
				const formData = new FormData();
				formData.append("title", form.title);
				formData.append("category", form.category);
				formData.append("description", form.description);
				formData.append("price", form.price);
				formData.append("publication_date", form.publication_date);
				if ((form.authorName || "").trim()) {
    formData.append("authorName", form.authorName.trim());
}
				console.log("User data:", {
					displayName: user?.displayName,
					username: user?.username,
					author: {
						name: form.authorName,
					},
				});

				// Add publisherName (using authorName from form or user's display name as fallback)
				const publisherName = (form.authorName || "")
				console.log("Using publisher name:", publisherName);

				// Try adding it with different field names that the backend might expect

				// Add keywords if provided
				if ((form.keywords || "").trim()) {
    const keywordsArray = (form.keywords || "")
        .split(",")
        .map((k) => k.trim())
        .filter((k) => k.length > 0);
    keywordsArray.forEach((keyword) => {
        formData.append("keywords", keyword);
    });
}

				// Add files - use the same field name that multer expects
				if (form.file) formData.append("bookFile", form.file);
				if (form.coverImage) formData.append("coverImage", form.coverImage);

				// Send directly to API endpoint (which gets rewritten to backend)
				const response = await fetch("/api/books/upload", {
					method: "POST",
					credentials: "include", // if you use cookies for other things
					headers: {
						Authorization: `Bearer ${token}`,
					},
					body: formData,
				});

				if (!response.ok) {
					const errorData = await response.json();
					throw new Error(errorData.error || "Failed to upload book");
				}

				// Show success message and reset form
				setSuccess(true);
				setTimeout(() => {
					setSuccess(false);
					setForm({
						title: "",
						category: "",
						description: "",
						price: "",
						keywords: "",
						publication_date: new Date().toISOString(),
						file: null,
						coverImage: null,
					});
				}, 3000);
			} catch (error) {
				console.error("Upload error:", error);
				setErrors((prev) => ({
					...prev,
					submit: error.message || "Failed to upload book. Please try again.",
				}));
			}
		}
	};

	return (
		<div className={styles["upload-container"]}>
			<h1 className={styles["upload-title"]}>Upload New Book</h1>
			{success ? (
				<div className={styles["upload-success"]}>
					✅ Book uploaded successfully!
					<br />
					<small style={{ opacity: 0.8 }}>Form will reset in 3 seconds...</small>
				</div>
			) : (
				<form className={styles["upload-form"]}>
					<div>
						<label className={styles["upload-label"]}>Book Title *</label>
						<input
							type="text"
							name="title"
							value={form.title}
							onChange={handleChange}
							placeholder="Enter the book title..."
							className={`${styles["upload-input"]} ${errors.title ? styles["upload-error"] : ""}`}
						/>
						{errors.title && <div className={styles["upload-error"]}>{errors.title}</div>}
					</div>
					<div>
						<label className={styles["upload-label"]}>Author Name *</label>
						<input
							type="text"
							name="authorName"
							value={form.authorName}
							onChange={handleChange}
							placeholder={
								publisherProfile?.penName
									? publisherProfile.penName
									: "Enter author name..."
							}
							className={`${styles["upload-input"]} ${errors.authorName ? styles["upload-error"] : ""}`}
						/>
						<small className={styles.helpText}>
							This will be displayed as the book&apos;s author. Leave blank to use your pen name.
						</small>
						{errors.authorName && <div className={styles["upload-error"]}>{errors.authorName}</div>}
					</div>
					<div>
						<label className={styles["upload-label"]}>Category *</label>
						<select
							name="category"
							value={form.category}
							onChange={handleChange}
							className={`${styles["upload-select"]} ${errors.category ? styles["upload-error"] : ""}`}
						>
							<option value="">Select a category...</option>
							<option value="fiction">Fiction</option>
							<option value="non-fiction">Non-Fiction</option>
							<option value="mystery">Mystery & Thriller</option>
							<option value="romance">Romance</option>
							<option value="sci-fi">Science Fiction</option>
							<option value="fantasy">Fantasy</option>
							<option value="biography">Biography</option>
							<option value="history">History</option>
							<option value="self-help">Self Help</option>
							<option value="business">Business</option>
							<option value="technology">Technology</option>
							<option value="children">Children&apos;s Books</option>
						</select>
						{errors.category && <div className={styles["upload-error"]}>{errors.category}</div>}
					</div>
					<div>
						<label className={styles["upload-label"]}>Description *</label>
						<textarea
							name="description"
							value={form.description}
							onChange={handleChange}
							placeholder="Enter a detailed description of the book..."
							className={`${styles["upload-textarea"]} ${errors.description ? styles["upload-error"] : ""}`}
						/>
						{errors.description && <div className={styles["upload-error"]}>{errors.description}</div>}
					</div>
					<div>
						<label className={styles["upload-label"]}>Price (₱) *</label>
						<input
							type="number"
							name="price"
							value={form.price}
							onChange={handleChange}
							placeholder="0.00"
							min="0"
							step="0.01"
							className={`${styles["upload-input"]} ${errors.price ? styles["upload-error"] : ""}`}
						/>
						{errors.price && <div className={styles["upload-error"]}>{errors.price}</div>}
					</div>
					<div>
						<label className={styles["upload-label"]}>Keywords (Optional)</label>
						<input
							type="text"
							name="keywords"
							value={form.keywords}
							onChange={handleChange}
							placeholder="Enter keywords separated by commas..."
							className={styles["upload-input"]}
						/>
						<small className={styles.helpText}>
							Keywords help readers find your book (e.g., fantasy, adventure, romance)
						</small>
					</div>
					<div>
						<label className={styles["upload-label"]}>Book File (PDF/EPUB) *</label>
						<input
							type="file"
							name="file"
							accept=".pdf,.epub"
							onChange={handleChange}
							className={`${styles["upload-input"]} ${errors.file ? styles["upload-error"] : ""}`}
						/>
						<small className={styles.helpText}>Supported formats: PDF, EPUB (Max 50MB)</small>
						{errors.file && <div className={styles["upload-error"]}>{errors.file}</div>}
					</div>
					<div>
						<label className={styles["upload-label"]}>Cover Image (Optional)</label>
						<input
							type="file"
							name="coverImage"
							accept="image/*"
							onChange={handleChange}
							className={styles["upload-input"]}
						/>
						<small className={styles.helpText}>Supported formats: JPG, PNG, WebP (Max 5MB)</small>
					</div>
					{errors.submit && <div className={styles["upload-error"]}>{errors.submit}</div>}
					<button type="button" onClick={handleSubmit} className={styles["upload-btn"]}>
						Upload Book
					</button>
				</form>
			)}
		</div>
	);
}

export default UploadBook;