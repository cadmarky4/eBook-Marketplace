"use client";

import React, { createContext, useState, useContext, useEffect } from "react";
import { useRouter } from "next/navigation";

const AuthContext = createContext();

export function AuthProvider({ children }) {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);
	const router = useRouter();

	// Load user from storage when the app starts
	useEffect(() => {
		const loadUserFromStorage = async () => {
			try {
				console.log("🔍 Checking for stored authentication...");
				// Check for auth token in localStorage FIRST
				const token = localStorage.getItem("authToken");

				if (token) {
					console.log("✅ Found token in localStorage");

					try {
						// Validate token with the server
						const response = await fetch("/api/user/validate-token", {
							headers: {
								Authorization: `Bearer ${token}`,
							},
						});

						console.log("🔄 Token validation response status:", response.status);

						if (response.ok) {
							// Token is valid, get user data
							const data = await response.json();
							console.log("👤 User data received:", data);
							if (data.user) {
								console.log("✅ Setting user data from token validation");
								setUser(data.user);
								localStorage.setItem("user", JSON.stringify(data.user));
							}
						} else {
							console.log("❌ Token invalid, clearing storage");
							localStorage.removeItem("authToken");
							localStorage.removeItem("user");
						}
					} catch (error) {
						console.error("Token validation error:", error);
					}
				} else {
					console.log("❌ No auth token found in localStorage");
				}
			} catch (error) {
				console.error("⚠️ Error loading user:", error);
			} finally {
				setLoading(false);
			}
		};

		loadUserFromStorage();
	}, []);

	// Login function
	const login = (userData, token, rememberMe) => {
		console.log("🔐 Login called with rememberMe:", rememberMe);
		setUser(userData);

		// Always store user data in localStorage for easier access
		localStorage.setItem("user", JSON.stringify(userData));

		// Always store token in localStorage when rememberMe is true
		if (rememberMe) {
			console.log("✅ Storing token in localStorage for persistent login");
			localStorage.setItem("authToken", token);
		} else {
			console.log("✅ Storing token in sessionStorage for session-only login");
			sessionStorage.setItem("authToken", token);
		}
	};

	// Logout function
	const logout = async () => {
		try {
			console.log("🚪 Logout initiated");
			// Call logout API if needed
			await fetch("/api/user/logout", { method: "POST" });
		} catch (error) {
			console.error("⚠️ Logout error:", error);
		} finally {
			// Clear all storage
			localStorage.removeItem("authToken");
			sessionStorage.removeItem("authToken");
			localStorage.removeItem("user");
			setUser(null);
			console.log("✅ User logged out, storage cleared");
			router.push("/auth");
		}
	};

	// Add the missing refreshUserData function
	const refreshUserData = async () => {
		// Add a timestamp to prevent frequent refreshes
		const lastRefresh = localStorage.getItem("lastUserRefresh");
		const now = Date.now();

		// Only refresh if more than 5 seconds since last refresh
		if (lastRefresh && now - parseInt(lastRefresh) < 5000) {
			console.log("Skipping refresh - too soon since last refresh");
			return;
		}

		try {
			localStorage.setItem("lastUserRefresh", now.toString());
			const token = localStorage.getItem("authToken");
			if (!token) return;

			const response = await fetch("/api/user/validate-token", {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (response.ok) {
				const userData = await response.json();
				setUser(userData.user);
			}
		} catch (error) {
			console.error("Error refreshing user data:", error);
		}
	};

	return (
		<AuthContext.Provider
			value={{
				user,
				loading,
				login,
				logout,
				refreshUserData,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}

export const useAuth = () => useContext(AuthContext);
