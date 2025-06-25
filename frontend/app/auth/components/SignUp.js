"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import SocialIcons from "./SocialIcons";
import { User } from "lucide-react";

const SignUp = ({ onModeChange }) => {
	const router = useRouter();
	const [formData, setFormData] = useState({
		fullName: "",
		email: "",
		username: "",
		password: "",
		confirmPassword: "",
	});
	const [error, setError] = useState("");

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		try {
			const response = await fetch("/api/user/register", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					fullName: formData.fullName,
					username: formData.username,
					email: formData.email,
					confirmPassword: formData.confirmPassword,
					password: formData.password,
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				setError(data.error || "Registration failed");
				return;
			}

			// Redirect to login or show success message
			onModeChange("login");
		} catch (err) {
			console.error("Registration error:", err);
			setError("An error occurred. Please try again.");
		}
	};

	return (
		<div className="form-card">
			<form onSubmit={handleSubmit} className="form-wrapper">
				<input type="text" name="fullName" placeholder="Full Name" value={formData.fullName} onChange={handleChange} className="form-input" />
				<input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} className="form-input" />
				<input type="text" name="username" placeholder="Username" value={formData.username} onChange={handleChange} className="form-input" />
				<input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} className="form-input" />
				<input type="password" name="confirmPassword" placeholder="Confirm Password" value={formData.confirmPassword} onChange={handleChange} className="form-input" />

				{error && <div className="error-message">{error}</div>}

				<button type="submit" className="form-button">
					Register
				</button>
			</form>

			<div className="switch-text">
				Already have an account?{" "}
				<span className="switch-link" onClick={() => onModeChange("login")}>
					Sign In
				</span>
			</div>

			<SocialIcons />
		</div>
	);
};

export default SignUp;
