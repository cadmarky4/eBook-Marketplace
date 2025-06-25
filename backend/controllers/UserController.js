const jwt = require("jsonwebtoken");

// controllers/userController.js - HTTP request/response handling
const UserService = require("../services/UserService");
const Customer = require("../models/Customer");
const User = require("../models/User");

class UserController {
	// Registration endpoints

	static async registerCustomer(req, res) {
		try {
			const { username, email, password, confirmPassword, fullName, phoneNumber, preferences } = req.body;

			// Validate required fields
			if (!fullName) {
				return res.status(400).json({
					success: false,
					error: "Full name is required",
				});
			}
			if (!username) {
				return res.status(400).json({
					success: false,
					error: "Username is required",
				});
			}
			if (!email) {
				return res.status(400).json({
					success: false,
					error: "Email is required",
				});
			}
			if (!password) {
				return res.status(400).json({
					success: false,
					error: "Password is required",
				});
			}

			if (!password || password.length < 8) {
				return res.status(400).json({
					success: false,
					error: "Password must be at least 8 characters long",
				});
			}

			if (password != confirmPassword) {
				return res.status(400).json({
					success: false,
					error: "Password and Confirm Password do not match",
				});
			}

			const userData = {
				username,
				email,
				password,
				fullName,
				phoneNumber,
				preferences: preferences || {},
			};

			const user = await UserService.createCustomer(userData);

			res.status(201).json({
				success: true,
				message: "Customer registered successfully",
				user: {
					id: user._id,
					username: user.username,
					email: user.email,
					fullName: user.fullName,
					userType: user.accountType, // This will now be lowercase
					createdAt: user.createdAt,
				},
			});
		} catch (err) {
			console.error("Customer registration error:", err);
			res.status(400).json({
				success: false,
				error: err.message,
			});
		}
	}

	static async registerPublisher(req, res) {
		try {
			const { username, email, password, phoneNumber, fullName, penName, biography, website, genres } = req.body;

			if (req.user) {
				// SCENARIO 1: Existing authenticated user upgrading to publisher
				console.log(`Existing user ${req.user.email} upgrading to publisher`);

				const publisherData = {
					penName,
					biography,
					website,
					genres,
				};

				const publisher = await UserService.upgradeToPublisher(req.user._id, publisherData);

				return res.status(201).json({
					success: true,
					message: "Successfully upgraded to publisher account",
					user: {
						id: req.user._id,
						username: req.user.username,
						email: req.user.email,
						phoneNumber: req.user.phoneNumber,
						fullName: req.user.fullName,
						userType: req.user.accountType,
						createdAt: req.user.createdAt,
					},
				});
			} else {
				// New user - require all base fields
				if (!username || !email || !password || !fullName) {
					return res.status(400).json({
						success: false,
						error: "Missing required fields for new user: username, password, fullName",
					});
				}
			}

			const userData = {
				username,
				email,
				password: password,
				phoneNumber,
				fullName,
				penName,
				biography,
				website,
				genres: genres || [],
			};

			const author = await UserService.createPublisher(userData);

			// Get the populated user data for response
			const populatedAuthor = await Publisher.findById(author._id).populate("user");

			res.status(201).json({
				success: true,
				message: "Publisher account registered successfully",
				user: {
					id: populatedAuthor.user._id,
					username: populatedAuthor.user.username,
					email: populatedAuthor.user.email,
					fullName: populatedAuthor.user.fullName,
					penName: populatedAuthor.penName, // <-- This is correct: use Publisher.penName, not username
					userType: populatedAuthor.user.accountType,
					createdAt: populatedAuthor.user.createdAt,
				},
			});
		} catch (err) {
			console.error("Author registration error:", err);

			if (err.code === "USER_EXISTS") {
				showModal({
					title: "Account Found",
					message: err.error,
					buttons: [
						{ text: "Sign In", action: () => (window.location.href = err.redirectUrl) },
						{ text: "Use Different Email", action: () => clearEmailField() },
					],
				});
			}
			res.status(400).json({
				success: false,
				error: err.message,
			});
		}
	}

	static async registerAdmin(req, res) {
		try {
			const { username, email, password, fullName, adminLevel, permissions, department } = req.body;

			if (!username || !email || !password || !fullName || !adminLevel) {
				return res.status(400).json({
					success: false,
					error: "Missing required fields: username, email, password, fullName, adminLevel",
				});
			}

			// Check if current user has permission to create admins
			if (!req.user || req.user.userType !== "Admin" || !req.user.hasPermission("user-management")) {
				return res.status(403).json({
					success: false,
					error: "Insufficient permissions to create admin users",
				});
			}

			const userData = {
				username,
				email,
				password: password,
				fullName,
				adminLevel,
				permissions: permissions || [],
				department,
			};

			const admin = await UserService.createAdmin(userData);

			res.status(201).json({
				success: true,
				message: "Admin registered successfully",
				user: {
					id: admin._id,
					username: admin.username,
					email: admin.email,
					fullName: admin.fullName,
					adminLevel: admin.adminLevel,
					userType: admin.userType,
					createdAt: admin.createdAt,
				},
			});
		} catch (err) {
			console.error("Admin registration error:", err);
			res.status(400).json({
				success: false,
				error: err.message,
			});
		}
	}

	// Authentication endpoints
	static async login(req, res) {
		try {
			const { email, password, rememberMe } = req.body;
			const user = await UserService.loginUser(email, password);

			// Generate JWT token with appropriate expiration
			const expiresIn = rememberMe ? "30d" : "1d";

			const token = jwt.sign(
				{
					userId: user._id,
					userType: user.accountType,
				},
				process.env.JWT_SECRET,
				{ expiresIn }
			);

			// Get subscription info if user is a customer
			let userData = user.toObject ? user.toObject() : { ...user };

			if (user.accountType.includes("Customer")) {
				const customer = await Customer.findOne({ user: user._id });
				if (customer) {
					userData.subscriptionPlan = customer.subscriptionPlan;
					userData.isPremium = customer.subscriptionPlan !== "free";
				}
			}

			// Return user data and token
			res.json({
				success: true,
				message: "Login successful",
				user: userData,
				token: token,
			});
		} catch (err) {
			console.error("Login error:", err);
			res.status(401).json({
				success: false,
				error: err.message,
			});
		}
	}

	static async validateToken(req, res) {
		try {
			console.log("Token validation endpoint called");

			// The auth middleware adds req.user if token is valid
			if (!req.user || !req.user._id) {
    return res.status(401).json({
        success: false,
        error: "Invalid token",
    });
}

			try {
				// Fetch user from database
				const user = await User.findById(req.user._id).select("-password");

				if (!user) {
					console.log("User not found for ID:", req.user.userId);
					return res.status(404).json({
						success: false,
						error: "User not found",
					});
				}

				console.log("User found:", user._id);

				// Convert to plain object
				let userData = user.toObject();

				// Add subscription data if available
				if (user.accountType?.includes("Customer")) {
					const Customer = require("../models/Customer");
					const customer = await Customer.findOne({ user: user._id });
					if (customer) {
						userData.subscriptionPlan = customer.subscriptionPlan;
						userData.isPremium = customer.subscriptionPlan !== "free";
					}
				}

				// Return successful response with user data
				return res.json({
					success: true,
					user: userData,
				});
			} catch (dbError) {
				console.error("Database error during validation:", dbError);
				return res.status(500).json({
					success: false,
					error: "Database error",
				});
			}
		} catch (error) {
			console.error("Token validation error:", error);
			return res.status(500).json({
				success: false,
				error: "Internal server error",
			});
		}
	}

	/*static async login(req, res) {
        try {
            const { email, password } = req.body;
            
            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    error: 'Email and password are required'
                });
            }

            const user = await UserService.authenticate(email, password);

            // In a real app, you'd create a JWT token here
            const userResponse = {
                id: user._id,
                username: user.username,
                email: user.email,
                fullName: user.fullName,
                userType: user.userType,
                avatar: user.avatar,
                lastLogin: user.lastLogin,
                avatarDisplay: user.getAvatarDisplay()
            };

            // Store user in session (or create JWT)
            req.session.userId = user._id;
            req.session.userType = user.userType;

            res.json({
                success: true,
                message: 'Login successful',
                user: userResponse
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(401).json({
                success: false,
                error: error.message
            });
        }
    }*/

	// Add a profile endpoint to get user data when needed
	static async getUserProfile(req, res) {
		try {
			const userId = req.user.userId;
			const user = await User.findById(userId).select("-password");

			if (!user) {
				return res.status(404).json({
					success: false,
					error: "User not found",
				});
			}

			return res.json(user);
		} catch (error) {
			console.error("Error fetching user profile:", error);
			return res.status(500).json({
				success: false,
				error: "Internal server error",
			});
		}
	}

	static async logout(req, res) {
		try {
			req.session.destroy((err) => {
				if (err) {
					return res.status(500).json({
						success: false,
						error: "Could not log out",
					});
				}
				res.json({
					success: true,
					message: "Logged out successfully",
				});
			});
		} catch (err) {
			res.status(500).json({
				success: false,
				error: "Logout failed",
			});
		}
	}

	static async forgotPassword(req, res) {
		try {
			const result = await UserService.handleForgotPassword(req.body.email);
			res.json(result);
		} catch (err) {
			console.error("Forgot password error:", err);
			res.status(500).json({ error: "An error occurred. Please try again." });
		}
	}

	static async changePassword(req, res) {
		try {
			const { currentPassword, newPassword } = req.body;
			const userId = req.user.id;

			if (!currentPassword || !newPassword) {
				return res.status(400).json({
					success: false,
					error: "Current password and new password are required",
				});
			}

			if (newPassword.length < 6) {
				return res.status(400).json({
					success: false,
					error: "New password must be at least 6 characters long",
				});
			}

			await UserService.changePassword(userId, currentPassword, newPassword);

			res.json({
				success: true,
				message: "Password changed successfully",
			});
		} catch (err) {
			console.error("Change password error:", err);
			res.status(400).json({
				success: false,
				error: err.message,
			});
		}
	}

	// Profile endpoints
	static async getProfile(req, res) {
		try {
			const userId = req.params.id || req.user.id;
			const profile = await UserService.getUserProfile(userId);

			if (!profile) {
				return res.status(404).json({
					success: false,
					error: "User not found",
				});
			}

			res.json({
				success: true,
				user: profile,
			});
		} catch (err) {
			console.error("Get profile error:", err);
			res.status(500).json({
				success: false,
				error: "Failed to get user profile",
			});
		}
	}

	static async updateProfile(req, res) {
		try {
			const userId = req.user.id;
			const updates = req.body;

			const updatedUser = await UserService.updateProfile(userId, updates);

			if (!updatedUser) {
				return res.status(404).json({
					success: false,
					error: "User not found",
				});
			}

			res.json({
				success: true,
				message: "Profile updated successfully",
				user: updatedUser,
			});
		} catch (err) {
			console.error("Update profile error:", err);
			res.status(400).json({
				success: false,
				error: err.message,
			});
		}
	}

	static async uploadAvatar(req, res) {
		try {
			const userId = req.user.id;

			if (!req.file) {
				return res.status(400).json({
					success: false,
					error: "No file uploaded",
				});
			}

			const avatarPath = `/uploads/avatars/${req.file.filename}`;
			const updatedUser = await UserService.updateAvatar(userId, avatarPath);

			res.json({
				success: true,
				message: "Avatar updated successfully",
				avatarUrl: avatarPath,
				user: {
					id: updatedUser._id,
					avatar: updatedUser.avatar,
					avatarDisplay: updatedUser.getAvatarDisplay(),
				},
			});
		} catch (err) {
			console.error("Upload avatar error:", err);
			res.status(500).json({
				success: false,
				error: "Failed to upload avatar",
			});
		}
	}

	static async removeAvatar(req, res) {
		try {
			const userId = req.user.id;
			const updatedUser = await UserService.removeAvatar(userId);

			res.json({
				success: true,
				message: "Avatar removed successfully",
				user: {
					id: updatedUser._id,
					avatar: updatedUser.avatar,
					avatarDisplay: updatedUser.getAvatarDisplay(),
				},
			});
		} catch (err) {
			console.error("Remove avatar error:", err);
			res.status(500).json({
				success: false,
				error: "Failed to remove avatar",
			});
		}
	}

	// Search and listing endpoints
	static async searchUsers(req, res) {
		try {
			const { q: query, page = 1, limit = 20, userType, sortBy = "createdAt", sortOrder = "desc" } = req.query;

			if (!query) {
				return res.status(400).json({
					success: false,
					error: "Search query is required",
				});
			}

			const options = {
				page: parseInt(page),
				limit: parseInt(limit),
				userType,
				sortBy,
				sortOrder: sortOrder === "desc" ? -1 : 1,
			};

			const results = await UserService.searchUsers(query, options);

			res.json({
				success: true,
				...results,
			});
		} catch (err) {
			console.error("Search users error:", err);
			res.status(500).json({
				success: false,
				error: "Search failed",
			});
		}
	}

	static async getCustomerById(req, res) {
		try {
			const customerId = req.params.id;

			// Check admin permissions
			if (!req.user || req.user.userType !== "Admin" || !req.user.hasPermission("user-management")) {
				return res.status(403).json({
					success: false,
					error: "Insufficient permissions",
				});
			}

			const customer = await UserService.getCustomerById(customerId);

			if (!customer) {
				return res.status(404).json({
					success: false,
					error: "Customer not found",
				});
			}

			res.json({
				success: true,
				customer,
			});
		} catch (err) {
			console.error("Get customer by ID error:", err);
			res.status(500).json({
				success: false,
				error: "Failed to get customer",
			});
		}
	}

	static async getCustomers(req, res) {
		try {
			const { page = 1, limit = 20, sortBy = "createdAt", sortOrder = "desc" } = req.query;

			// Check admin permissions
			if (!req.user || req.user.userType !== "Admin" || !req.user.hasPermission("user-management")) {
				return res.status(403).json({
					success: false,
					error: "Insufficient permissions",
				});
			}

			const options = {
				page: parseInt(page),
				limit: parseInt(limit),
				sortBy,
				sortOrder: sortOrder === "desc" ? -1 : 1,
			};

			const results = await UserService.getAllCustomers(options);

			res.json({
				success: true,
				...results,
			});
		} catch (err) {
			console.error("Get customers error:", err);
			res.status(500).json({
				success: false,
				error: "Failed to get customers",
			});
		}
	}

	static async getPublisherById(req, res) {
		try {
			const publisherId = req.params.id;

			// Check admin permissions
			if (!req.user || req.user.userType !== "Admin" || !req.user.hasPermission("user-management")) {
				return res.status(403).json({
					success: false,
					error: "Insufficient permissions",
				});
			}

			const publisher = await UserService.getPublisherById(publisherId);

			if (!publisher) {
				return res.status(404).json({
					success: false,
					error: "Publisher not found",
				});
			}

			res.json({
				success: true,
				publisher,
			});
		} catch (err) {
			console.error("Get publisher by ID error:", err);
			res.status(500).json({
				success: false,
				error: "Failed to get publisher",
			});
		}
	}

	static async getPublishers(req, res) {
		try {
			const { page = 1, limit = 20, verified, sortBy = "stats.totalSales", sortOrder = "desc" } = req.query;

			const options = {
				page: parseInt(page),
				limit: parseInt(limit),
				verified: verified !== undefined ? verified === "true" : null,
				sortBy,
				sortOrder: sortOrder === "desc" ? -1 : 1,
			};

			const results = await UserService.getAllPublishers(options);

			res.json({
				success: true,
				...results,
			});
		} catch (err) {
			console.error("Get authors error:", err);
			res.status(500).json({
				success: false,
				error: "Failed to get authors",
			});
		}
	}

	// Statistics endpoints
	static async getUserStats(req, res) {
		try {
			// Check admin permissions
			if (!req.user || req.user.userType !== "Admin" || !req.user.hasPermission("analytics-view")) {
				return res.status(403).json({
					success: false,
					error: "Insufficient permissions",
				});
			}

			const stats = await UserService.getUserStats();

			res.json({
				success: true,
				stats,
			});
		} catch (err) {
			console.error("Get user stats error:", err);
			res.status(500).json({
				success: false,
				error: "Failed to get user statistics",
			});
		}
	}

	// Customer-specific endpoints
	static async addToWishlist(req, res) {
		try {
			const customerId = req.user.id;
			const { bookId } = req.body;

			if (req.user.userType !== "Customer") {
				return res.status(403).json({
					success: false,
					error: "Only customers can have wishlists",
				});
			}

			const customer = await UserService.addToWishlist(customerId, bookId);

			res.json({
				success: true,
				message: "Book added to wishlist",
				wishlistCount: customer.wishlist.length,
			});
		} catch (err) {
			console.error("Add to wishlist error:", err);
			res.status(400).json({
				success: false,
				error: err.message,
			});
		}
	}

	static async getWishlist(req, res) {
		try {
			const customerId = req.user.id;

			if (req.user.userType !== "Customer") {
				return res.status(403).json({
					success: false,
					error: "Only customers have wishlists",
				});
			}

			const wishlist = await UserService.getWishlist(customerId);

			res.json({
				success: true,
				wishlist,
			});
		} catch (err) {
			console.error("Get wishlist error:", err);
			res.status(500).json({
				success: false,
				error: "Failed to get wishlist",
			});
		}
	}

	// Author-specific endpoints
	static async getPublisherData(req, res) {
		try {
			// req.user is set by auth middleware
			const publisherProfile = await Publisher.findOne({ user: req.user._id });

			if (publisherProfile) {
				return res.status(200).json({
					success: true,
					publisherData: {
						penName: publisherProfile.penName,
						biography: publisherProfile.biography,
						website: publisherProfile.website,
						genres: publisherProfile.genres,
					},
				});
			}

			res.status(200).json({
				success: true,
				publisherData: null,
			});
		} catch (err) {
			console.error("Get publisher data error:", err);
			res.status(500).json({
				success: false,
				error: "Server error while fetching publisher data",
			});
		}
	}

	static async upgradeToPublisher(req, res) {
		try {
			const { penName, biography, website, genres } = req.body;

			// Get the correct user ID from the req.user object
			const userId = req.user.userId || req.user._id;

			if (!userId) {
				return res.status(400).json({
					success: false,
					error: "User ID not found in authentication token",
				});
			}

			// Initialize accountType as an array if it doesn't exist
			if (!req.user.accountType) {
				req.user.accountType = [];
			}

			// Check if user already has publisher profile
			if (Array.isArray(req.user.accountType) && req.user.accountType.includes("publisher")) {
				return res.status(400).json({
					success: false,
					error: "User already has publisher account",
				});
			}

			const publisherData = { penName, biography, website, genres };
			const publisher = await UserService.upgradeToPublisher(userId, publisherData);

			// Update user's account type in the session/token data
			if (!Array.isArray(req.user.accountType)) {
				req.user.accountType = [];
			}
			req.user.accountType.push("Publisher");

			res.status(201).json({
				success: true,
				message: "Successfully upgraded to publisher account",
				publisher: {
					id: publisher._id,
					penName: publisher.penName,
					biography: publisher.biography,
					website: publisher.website,
					genres: publisher.genres,
				},
				user: {
					id: userId,
					username: req.user.username,
					email: req.user.email,
					fullName: req.user.fullName,
					accountType: req.user.accountType,
					createdAt: req.user.createdAt,
				},
			});
		} catch (err) {
			console.error("Publisher upgrade error:", err);
			res.status(400).json({
				success: false,
				error: err.message,
			});
		}
	}

	static async getPublisherProfile(req, res) {
		try {
			const authorId = req.params.id;
			const profile = await UserService.getPublisherProfile(authorId);

			if (!profile) {
				return res.status(404).json({
					success: false,
					error: "Author not found",
				});
			}

			res.json({
				success: true,
				author: profile,
			});
		} catch (err) {
			console.error("Get author profile error:", err);
			res.status(500).json({
				success: false,
				error: "Failed to get author profile",
			});
		}
	}

	static async updatePublisherEarnings(req, res) {
		try {
			const amount = req.body.amount;
			const auhtorId = req.params.id;

			const author = await UserService.updatePublisherEarnings(auhtorId, amount);
		} catch (err) {
			console.error("Update publisher earnings error:", err);
			res.status(500).json({
				success: false,
				error: "Failed to update publisher earnings",
			});
		}
	}

	static async processPublisherPayment(req, res) {
		try {
			const { authorId, amount } = req.body;

			const paymentResult = await UserService.processPublisherPayment(authorId, amount);

			res.json({
				success: true,
				message: "Payment processed successfully",
				payment: paymentResult,
			});
		} catch (err) {
			console.error("Process publisher payment error:", err);
			res.status(400).json({
				success: false,
				error: err.message,
			});
		}
	}

	static async verifyPublisher(req, res) {
		try {
			const { authorId } = req.params;

			// Check admin permissions
			if (!req.user || req.user.userType !== "Admin" || !req.user.hasPermission("user-management")) {
				return res.status(403).json({
					success: false,
					error: "Insufficient permissions",
				});
			}

			const author = await UserService.verifyPublisher(authorId);

			res.json({
				success: true,
				message: "Author verified successfully",
				author: {
					id: author._id,
					displayName: author.getDisplayName(),
					isVerified: author.authorVerification.isVerified,
					verificationDate: author.authorVerification.verificationDate,
				},
			});
		} catch (err) {
			console.error("Verify publisher error:", err);
			res.status(400).json({
				success: false,
				error: err.message,
			});
		}
	}

	// Admin user management
	static async deactivateUser(req, res) {
		try {
			const { userId } = req.params;

			// Check admin permissions
			if (!req.user || req.user.userType !== "Admin" || !req.user.hasPermission("user-management")) {
				return res.status(403).json({
					success: false,
					error: "Insufficient permissions",
				});
			}

			const user = await UserService.deactivateUser(userId);

			res.json({
				success: true,
				message: "User deactivated successfully",
				user: {
					id: user._id,
					username: user.username,
					isActive: user.isActive,
				},
			});
		} catch (err) {
			console.error("Deactivate user error:", err);
			res.status(400).json({
				success: false,
				error: err.message,
			});
		}
	}
}

module.exports = UserController;
