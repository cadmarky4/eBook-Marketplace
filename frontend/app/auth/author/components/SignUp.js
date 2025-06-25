"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SocialIcons from "../../components/SocialIcons";
import { useAuth } from "@/components/layouts/AuthContext";

const SignUp = ({ onModeChange }) => {
	const router = useRouter();
	const { user, login, refreshUserData } = useAuth();
	const [formPart, setFormPart] = useState(1);
	const [formData, setFormData] = useState({
		fullName: "",
		email: "",
		username: "",
		password: "",
		confirmPassword: "",
		phoneNumber: "",
		penName: "",
		biography: "",
		website: "",
		genres: [],
	});
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	// Derive authentication status from user object
	const isAuthenticated = !!user;

	const availableGenres = ["fiction", "non-fiction", "mystery", "romance", "sci-fi", "fantasy", "biography", "history", "self-help", "technology"];

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleGenreChange = (e) => {
		const { value, checked } = e.target;
		setFormData((prev) => ({
			...prev,
			genres: checked ? [...prev.genres, value] : prev.genres.filter((genre) => genre !== value),
		}));
	};

	// If user is already authenticated, prefill data and skip to part 2
	useEffect(() => {
		if (user) {
			console.log("User already authenticated, prefilling data and skipping to step 2");
			setFormData((prev) => ({
				...prev,
				fullName: user.fullName || "",
				email: user.email || "",
				username: user.username || "",
				phoneNumber: user.phoneNumber || "",
			}));
			setFormPart(2);
		}
	}, [user]);

	// Handle submission of basic information (first part)
	const handlePartOneSubmit = async (e) => {
		e.preventDefault();
		setError("");
		setIsLoading(true);

		try {
			// Basic validation
			if (formData.password !== formData.confirmPassword) {
				setError("Passwords don't match");
				return;
			}

			// Check if email already exists
			const checkResponse = await fetch("/api/user/check", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email: formData.email }),
			});

			if (!checkResponse.ok) {
				setError("Unable to verify email. Please try again.");
				return;
			}

			const checkData = await checkResponse.json();

			if (checkData.exists) {
				// Email exists - ask if user wants to log in
				setError("This email is already registered.");

				// Offer to log in with provided credentials
				const shouldLogin = window.confirm("This email is already registered. Would you like to log in with these credentials?");

				if (shouldLogin) {
					// Try to log in with the provided credentials
					try {
						const loginResponse = await fetch("/api/user/login", {
							method: "POST",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({
								email: formData.email,
								password: formData.password,
							}),
						});

						if (loginResponse.ok) {
							const loginData = await loginResponse.json();
							// Use the AuthContext login function to set user and token
							login(loginData.user, loginData.token, true);
							// Will automatically transition to step 2 because of the useEffect
							await refreshUserData();
						} else {
							// Login failed, redirect to login page
							onModeChange("login");
						}
					} catch (loginErr) {
						console.error("Login error:", loginErr);
						onModeChange("login");
					}
				}
				return;
			}

			// Email doesn't exist, proceed to part 2
			setFormPart(2);
		} catch (err) {
			console.error("Form validation error:", err);
			setError("An error occurred. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	// Final submission with all publisher data
	const handleFinalSubmit = async (e) => {
		e.preventDefault();
		setError("");
		setIsLoading(true);
		const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");

		if (isAuthenticated && !token) {
			setError("Authentication token not found. Please log in again.");
			setTimeout(() => onModeChange("login"), 1500);
			return;
		}

		try {
			// Determine if we're registering a new user or upgrading an existing one
			const endpoint = isAuthenticated ? "/api/publisher/upgrade/publisher" : "/api/publisher/register/publisher";

			// Prepare the data based on the endpoint
			const requestData = isAuthenticated
				? {
						// Only publisher-specific data for upgrade
						penName: formData.penName || undefined,
						biography: formData.biography || undefined,
						website: formData.website || undefined,
						genres: formData.genres.length > 0 ? formData.genres : undefined,
				  }
				: {
						// Complete user data for new registration
						fullName: formData.fullName,
						email: formData.email,
						username: formData.username,
						password: formData.password,
						phoneNumber: formData.phoneNumber,
						// Publisher specific data
						penName: formData.penName || undefined,
						biography: formData.biography || undefined,
						website: formData.website || undefined,
						genres: formData.genres.length > 0 ? formData.genres : undefined,
				  };

			const response = await fetch(endpoint, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					...(isAuthenticated && { Authorization: `Bearer ${token}` }),
				},
				body: JSON.stringify(requestData),
			});

			// Handle non-JSON responses
			const contentType = response.headers.get("content-type");
			if (!contentType || !contentType.includes("application/json")) {
				throw new Error(`API returned non-JSON response: ${await response.text()}`);
			}

			const data = await response.json();

			if (!response.ok) {
				// Handle specific error codes
				if (data.code === "USER_EXISTS") {
					setError("User with this email already exists. Please sign in instead.");
					setTimeout(() => {
						if (window.confirm("Would you like to go to the login page?")) {
							onModeChange("login");
						}
					}, 500);
				} else {
					setError(data.error || "Registration failed");
				}
				return;
			}

			// Registration/upgrade successful
			if (isAuthenticated) {
				// Refresh user data to update account type
				await refreshUserData();
				alert("Your account has been upgraded to publisher successfully!");
				router.push("/dashboard");
			} else {
				// For new users, log them in
				if (data.token && data.user) {
					login(data.user, data.token, true);
					alert("Registration successful! You've been automatically logged in.");
					router.push("/dashboard");
				} else {
					alert("Registration successful! You can now log in.");
					onModeChange("login");
				}
			}
		} catch (err) {
			console.error("Registration error:", err);
			setError("An error occurred. Please try again: " + err.message);
		} finally {
			setIsLoading(false);
		}
	};

	// Return to part 1 from part 2
	const handleBack = () => {
		setFormPart(1);
	};

	return (
		<div className="form-card">
			<h2 className="text-xl font-semibold mb-4">{isAuthenticated ? "Upgrade to Publisher Account" : `Publisher Registration ${formPart === 1 ? "(Step 1 of 2)" : "(Step 2 of 2)"}`}</h2>

			{formPart === 1 && !isAuthenticated ? (
				// PART 1: Basic user information (only shown for new users)
				<form onSubmit={handlePartOneSubmit} className="form-wrapper">
					<h3 className="text-lg font-medium mb-2">Basic Information</h3>
					<input type="text" name="fullName" placeholder="Full Name" value={formData.fullName} onChange={handleChange} className="form-input" required />
					<input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} className="form-input" required />
					<input type="text" name="username" placeholder="Username" value={formData.username} onChange={handleChange} className="form-input" required />
					<input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} className="form-input" required />
					<input type="password" name="confirmPassword" placeholder="Confirm Password" value={formData.confirmPassword} onChange={handleChange} className="form-input" required />
					<input type="tel" name="phoneNumber" placeholder="Phone Number" value={formData.phoneNumber} onChange={handleChange} className="form-input" />

					{error && <div className="error-message mt-4 text-red-500">{error}</div>}

					<button type="submit" className="form-button mt-4" disabled={isLoading}>
						{isLoading ? "Checking..." : "Continue"}
					</button>
				</form>
			) : (
				// PART 2: Publisher-specific information
				<form onSubmit={handleFinalSubmit} className="form-wrapper">
					{!isAuthenticated && (
						<button type="button" onClick={handleBack} className="back-button mb-4">
							← Back to Basic Information
						</button>
					)}

					<h3 className="text-lg font-medium mb-2">Publisher Profile</h3>
					<input type="text" name="penName" placeholder="Pen Name (optional)" value={formData.penName} onChange={handleChange} className="form-input" />
					<textarea name="biography" placeholder="Biography (optional, max 2000 characters)" value={formData.biography} onChange={handleChange} className="form-input min-h-[100px]" maxLength={2000}></textarea>
					<input type="url" name="website" placeholder="Website URL (optional)" value={formData.website} onChange={handleChange} className="form-input" />

					<div className="mt-4 mb-4">
						<label className="block text-sm font-medium mb-2">Genres (select at least one)</label>
						<div className="grid grid-cols-2 gap-2">
							{availableGenres.map((genre) => (
								<label key={genre} className="flex items-center space-x-2">
									<input type="checkbox" name="genres" value={genre} checked={formData.genres.includes(genre)} onChange={handleGenreChange} className="form-checkbox" />
									<span className="capitalize">{genre}</span>
								</label>
							))}
						</div>
					</div>

					{error && <div className="error-message mt-4 text-red-500">{error}</div>}

					<button type="submit" className="form-button mt-4" disabled={isLoading}>
						{isLoading ? (isAuthenticated ? "Upgrading..." : "Registering...") : isAuthenticated ? "Upgrade Account" : "Complete Registration"}
					</button>
				</form>
			)}

			{!isAuthenticated && (
				<div className="switch-text mt-4">
					Already have an account?{" "}
					<span className="switch-link" onClick={() => onModeChange("login")}>
						Sign In
					</span>
				</div>
			)}

			<SocialIcons />
		</div>
	);
};

export default SignUp;
