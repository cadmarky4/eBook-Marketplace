"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import SocialIcons from "./SocialIcons";

const LogIn = ({ onModeChange }) => {
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [rememberMe, setRememberMe] = useState(true);
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!email || !password) {
			setError("Please enter both email and password.");
			return;
		}

		setError("");
		setIsLoading(true);

		try {
			const response = await fetch("/api/user/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, password, rememberMe }),
			});

			const data = await response.json();

			if (!response.ok) {
				setError(data.error || "Login failed");
				setIsLoading(false);
				return;
			}

			if (data.token) {
				// DIRECTLY store token in localStorage without using context
				console.log("Storing token with rememberMe:", rememberMe);

				// Always store in localStorage for persistent login
				localStorage.setItem("authToken", data.token);
				localStorage.setItem("user", JSON.stringify(data.user));

				// Navigate AFTER token is stored
				console.log("Login successful, redirecting");
				setTimeout(() => {
					router.push("/main");
				}, 100);
			} else {
				setError("No authentication token received");
			}
		} catch (err) {
			console.error("Login error:", err);
			setError("An error occurred. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="form-card">
			<h1 className="auth-title">Welcome</h1>
			<div className="auth-subtitle">Sign in to Continue</div>

			<form onSubmit={handleSubmit} className="form-wrapper">
				<input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="form-input" />
				<input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="form-input" />

				<div className="form-checkbox-container">
					<input type="checkbox" id="rememberMe" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="form-checkbox" />
					<label htmlFor="rememberMe" className="form-checkbox-label">
						Remember me
					</label>
				</div>

				<div className="forgot-password-link" onClick={() => onModeChange("forgot-password")}>
					Forgot Password?
				</div>

				{error && <div className="error-message">{error}</div>}

				<button type="submit" className="form-button" disabled={isLoading}>
					{isLoading ? "Logging in..." : "Login"}
				</button>
			</form>

			<div className="switch-text">
				Don&apos;t have an account?{" "}
				<span className="switch-link" onClick={() => onModeChange("register")}>
					Register Here.
				</span>
			</div>

			<SocialIcons />
		</div>
	);
};

export default LogIn;
