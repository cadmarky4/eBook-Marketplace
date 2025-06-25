"use client";

import React, { useState } from "react";

const ForgotPassword = ({ onModeChange }) => {
	const [email, setEmail] = useState("");
	const [isSubmitted, setIsSubmitted] = useState(false);
	const [error, setError] = useState("");

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (!email) {
			setError("Email is required");
			return;
		}

		setError("");

		try {
			const response = await fetch("/api/auth/forgot-password", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email }),
			});

			const data = await response.json();

			if (!response.ok) {
				setError(data.error || "Failed to send reset email");
				return;
			}

			setIsSubmitted(true);
		} catch (err) {
			console.error("Forgot password error:", err);
			setError("An error occurred. Please try again.");
		}
	};

	return (
		<div className="form-card">
			<button className="back-button" onClick={() => onModeChange("login")}>
				←
			</button>
			<h1 className="auth-title forgot-password">Forgot Password</h1>
			<div className="auth-subtitle forgot-password">Enter your email address and we&apos;ll send you a link to reset your password.</div>

			{!isSubmitted ? (
				<form onSubmit={handleSubmit} className="form-wrapper">
					<input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="form-input" />

					{error && <div className="error-message">{error}</div>}

					<button type="submit" className="form-button">
						Send Reset Link
					</button>
				</form>
			) : (
				<div className="message-container">
					<div className="success-message">Password reset link has been sent to your email.</div>
					<button className="form-button" onClick={() => onModeChange("login")} style={{ marginTop: "20px" }}>
						Return to Login
					</button>
				</div>
			)}
		</div>
	);
};

export default ForgotPassword;
