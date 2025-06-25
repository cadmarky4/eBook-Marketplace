// services/UserService.js - Business logic only
const User = require("../models/User");
const Customer = require("../models/Customer");
const Publisher = require("../models/Publisher");
const Admin = require("../models/Admin");

class UserService {
	// User creation methods

	// Fix for createUser method
	static async createUser({ username, email, fullName, password, phoneNumber }) {
		// Create new user
		const user = await User.create({
			username,
			email,
			fullName,
			password,
			phoneNumber,
		});

		return user;
		// Return user without password
		//const userObj = user.toObject();
		//delete userObj.password;
		//return userObj; // Add this return statement
	}

	static async createCustomer(userData) {
		try {
			const { email } = userData;

			// Check if user already exists
			let user = await User.findOne({ email });
			if (!user) {
				// call the createUser function that returns userObj
				user = await this.createUser(userData);
			}

			// check if user has this account type already
			if (user.accountType.includes("Customer")) {
				throw new Error("User with this email already exists");
			}

			user.accountType.push("Customer");
			await user.save();

			const customer = new Customer({
				user: user._id,
			});

			await customer.save();

			return user; // Return the user object directly
		} catch (error) {
			if (error.code === 11000) {
				const field = Object.keys(error.keyPattern)[0];
				throw new Error(`${field} already exists`);
			}
			throw error;
		}
	}

	static async createPublisher(userData) {
		try {
			const { username, email, password, phoneNumber, fullName, penName, biography, website, genres } = userData;

			// Check if user already exists
			const existingUser = await User.findOne({ email });

			if (existingUser) {
				const error = new Error("User with this email already exists. Please sign in and upgrade your account instead.");
				error.code = "USER_EXISTS";
				error.redirectUrl = `/signin?email=${encodeURIComponent(email)}&redirect=upgrade-publisher`;

				throw error;
			}

			const baseUserData = { username, email, password, phoneNumber, fullName, accountType: ["Publisher"] };

			//call the createUser function that returns userObj
			const user = await this.createUser(baseUserData);

			const author = new Publisher({
				user: user._id,
				penName: penName || null, // <-- This is correct, do not default to username
				biography: biography || null,
				website: website || null,
				genres: genres || [],
			});

			return await author.save();
		} catch (error) {
			if (error.code === 11000) {
				const field = Object.keys(error.keyPattern)[0];
				throw new Error(`${field} already exists`);
			}
			throw error;
		}
	}

	/*static async upgradeToPublisher(userId, publisherData) {
		try {
			// Get the existing user
			const user = await User.findById(userId);
			if (!user) {
				throw new Error("User not found");
			}

			// Check if user already has publisher account type
			if (user.accountType.includes("publisher")) {
				throw new Error("User already has publisher profile");
			}

			// Add publisher account type
			user.accountType.push("publisher");
			await user.save();

			const { penName, biography, website, genres } = publisherData;

			// Create publisher profile with publisher-specific fields
			const publisher = new Publisher({
				user: user._id,
				penName: penName || null,
				biography: biography || null,
				website: website || null,
				genres: genres || [],
			});

			return await publisher.save();
		} catch (error) {
			if (error.code === 11000) {
				const field = Object.keys(error.keyPattern)[0];
				throw new Error(`${field} already exists`);
			}
			throw error;
		}
	}*/

	static async upgradeToPublisher(userId, publisherData) {
		try {
			// Get the existing user
			const user = await User.findById(userId);
			if (!user) {
				throw new Error("User not found");
			}

			// Initialize accountType as array if it doesn't exist
			if (!user.accountType) {
				user.accountType = [];
			}

			// Check if user already has publisher account type
			if (Array.isArray(user.accountType) && user.accountType.includes("Publisher")) {
				throw new Error("User already has publisher profile");
			}

			// Add publisher account type
			user.accountType.push("Publisher");
			await user.save();

			const { penName, biography, website, genres } = publisherData;

			// Create publisher profile with publisher-specific fields
			const publisher = new Publisher({
				user: user._id,
				penName: penName || null,
				biography: biography || null,
				website: website || null,
				genres: genres || [],
			});

			return await publisher.save();
		} catch (error) {
			if (error.code === 11000) {
				const field = Object.keys(error.keyPattern)[0];
				throw new Error(`${field} already exists`);
			}
			throw error;
		}
	}

	static async createAdmin(userData) {
		try {
			const { email } = userData;

			// Check if user already exists
			const user = await User.findOne({ email });
			if (!user) {
				//call the createUser function that returns userObj
				user = await this.createUser(userData);
			}

			//check if user has this account type already
			if (user.accountType.includes("Admin")) {
				throw new Error("User with this email is already an admin");
			}

			user.accountType.push("Admin");
			await user.save();

			const admin = new Admin({
				user: user._id,
			});

			return await admin.save();
		} catch (error) {
			if (error.code === 11000) {
				const field = Object.keys(error.keyPattern)[0];
				throw new Error(`${field} already exists`);
			}
			throw error;
		}
	}

	// Authentication methods
	static async authenticate(email, password) {
		const user = await User.findOne({
			email: email.toLowerCase(),
			isActive: true,
		});

		if (!user) {
			throw new Error("Invalid credentials");
		}

		const isPasswordValid = await user.comparePassword(password);
		if (!isPasswordValid) {
			throw new Error("Invalid credentials");
		}

		await user.updateLastLogin();
		return user;
	}

	//for login user
	static async loginUser(email, password) {
		// Find user by email
		const user = await User.findOne({ email: email.toLowerCase(), isActive: true });

		// Compare password using the method from User model
		if (!user || !(await user.comparePassword(password))) {
			throw new Error("Invalid email or password");
		}

		try {
			// Try to update last login with error handling
			await user.updateLastLogin();
		} catch (err) {
			console.error("Error updating last login:", err);
			// Continue even if update fails
		}

		// Return user without password
		const userObj = user.toObject();
		delete userObj.password;
		return userObj; // Add this return statement
	}

	static async handleForgotPassword(email) {
		const user = await User.findOne({ email });
		if (!user) {
			// For security, don't reveal if email exists or not
			return { message: "If your email is registered, you will receive a reset link" };
		}

		// Here you would normally generate a reset token and send an email

		return { message: "If your email is registered, you will receive a reset link" };
	}

	static async changePassword(userId, currentPassword, newPassword) {
		const user = await User.findById(userId);
		if (!user) {
			throw new Error("User not found");
		}

		const isCurrentPasswordValid = await user.comparePassword(currentPassword);
		if (!isCurrentPasswordValid) {
			throw new Error("Current password is incorrect");
		}

		user.password = newPassword; // Will be hashed by pre-save middleware
		await user.save();
		return true;
	}

	// User retrieval methods
	static async findByEmail(email) {
		return await User.findOne({
			email: email.toLowerCase(),
			isActive: true,
		});
	}

	static async findById(id) {
		return await User.findById(id);
	}

	static async getUserProfile(userId) {
		const user = await User.findById(userId).select("-password");
		if (!user) return null;

		const profile = user.toObject();
		profile.avatarDisplay = user.getAvatarDisplay();

		return profile;
	}

	// User update methods
	static async updateProfile(userId, updates) {
		const allowedUpdates = ["displayName", "phoneNumber", "avatar", "profile", "preferences"];
		const updateDoc = { updatedAt: new Date() };

		for (const [key, value] of Object.entries(updates)) {
			if (allowedUpdates.includes(key)) {
				updateDoc[key] = value;
			}
		}

		const result = await User.findByIdAndUpdate(userId, { $set: updateDoc }, { new: true, runValidators: true }).select("-password");

		return result;
	}

	static async updateAvatar(userId, avatarUrl) {
		const user = await User.findById(userId);
		if (!user) throw new Error("User not found");

		user.avatar = avatarUrl;
		user.updatedAt = new Date();
		await user.save();

		return user;
	}

	static async removeAvatar(userId) {
		const user = await User.findById(userId);
		if (!user) throw new Error("User not found");

		user.avatar = null;
		user.updatedAt = new Date();
		await user.save();

		return user;
	}

	// User management methods
	static async deactivateUser(userId) {
		const result = await User.findByIdAndUpdate(
			userId,
			{
				isActive: false,
				updatedAt: new Date(),
			},
			{ new: true }
		);

		return result;
	}

	static async reactivateUser(userId) {
		const result = await User.findByIdAndUpdate(
			userId,
			{
				isActive: true,
				updatedAt: new Date(),
			},
			{ new: true }
		);

		return result;
	}

	// Search and listing methods
	static async searchUsers(query, options = {}) {
		const { page = 1, limit = 20, userType = null, sortBy = "createdAt", sortOrder = -1, includeInactive = false } = options;

		const skip = (page - 1) * limit;

		const searchQuery = {
			$or: [{ username: { $regex: query, $options: "i" } }, { email: { $regex: query, $options: "i" } }, { fullName: { $regex: query, $options: "i" } }],
		};

		if (userType) {
			searchQuery.userType = userType;
		}

		if (!includeInactive) {
			searchQuery.isActive = true;
		}

		const users = await User.find(searchQuery)
			.sort({ [sortBy]: sortOrder })
			.skip(skip)
			.limit(limit)
			.select("-password");

		const usersWithAvatars = users.map((user) => {
			const userObj = user.toObject();
			userObj.avatarDisplay = user.getAvatarDisplay();
			return userObj;
		});

		const total = await User.countDocuments(searchQuery);

		return {
			users: usersWithAvatars,
			total,
			page,
			pages: Math.ceil(total / limit),
		};
	}

	static async getCustomerById(customerId) {
		const customer = await Customer.findById(customerId)
			.select("-password")
			.populate({
				path: "wishlist",
				select: "title price cover_image_url",
				populate: {
					path: "author",
					select: "name",
				},
			})
			.populate({
				path: "readingList.bookId",
				select: "title cover_image_url",
				populate: {
					path: "author",
					select: "name",
				},
			})
			.populate({
				path: "reviews.bookId",
				select: "title",
				populate: {
					path: "author",
					select: "name",
				},
			});

		if (!customer) {
			throw new Error("Customer not found");
		}

		return customer;
	}

	static async getAllCustomers(options = {}) {
		const { page = 1, limit = 20, sortBy = "createdAt", sortOrder = -1 } = options;
		const skip = (page - 1) * limit;

		const customers = await Customer.find({ isActive: true })
			.sort({ [sortBy]: sortOrder })
			.skip(skip)
			.limit(limit)
			.select("-password")
			.populate("wishlist", "title author price coverImage")
			.populate("purchaseHistory.bookId", "title author");

		const total = await Customer.countDocuments({ isActive: true });

		return {
			customers,
			total,
			page,
			pages: Math.ceil(total / limit),
		};
	}

	static async getPublisherById(publisherId) {
		const publisher = await Publisher.findById(publisherId).select("-password").populate("publishedBooks", "title publication_date rating");

		if (!publisher) {
			throw new Error("Publisher not found");
		}

		return publisher;
	}

	static async getAllPublishers(options = {}) {
		const { page = 1, limit = 20, verified = null, sortBy = "stats.totalSales", sortOrder = -1 } = options;
		const skip = (page - 1) * limit;

		const query = { isActive: true };
		if (verified !== null) {
			query["publisherVerification.isVerified"] = verified;
		}

		const authors = await Publisher.find(query)
			.sort({ [sortBy]: sortOrder })
			.skip(skip)
			.limit(limit)
			.select("-password")
			.populate("publishedBooks", "title publication_date rating");

		const total = await Publisher.countDocuments(query);

		return {
			authors,
			total,
			page,
			pages: Math.ceil(total / limit),
		};
	}

	// Statistics methods
	static async getUserStats() {
		const stats = await User.aggregate([
			{
				$group: {
					_id: "$userType",
					count: { $sum: 1 },
					active: {
						$sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] },
					},
					thisMonth: {
						$sum: {
							$cond: [{ $gte: ["$createdAt", new Date(new Date().setDate(1))] }, 1, 0],
						},
					},
					emailVerified: {
						$sum: { $cond: [{ $eq: ["$emailVerified", true] }, 1, 0] },
					},
				},
			},
		]);

		return stats.reduce((acc, stat) => {
			acc[stat._id.toLowerCase()] = {
				total: stat.count,
				active: stat.active,
				thisMonth: stat.thisMonth,
				emailVerified: stat.emailVerified,
			};
			return acc;
		}, {});
	}

	static async getRecentUsers(limit = 10) {
		return await User.find({ isActive: true }).sort({ createdAt: -1 }).limit(limit).select("username fullName email userType createdAt avatar").lean();
	}

	// Customer-specific methods
	static async addToWishlist(customerId, bookId) {
		const customer = await Customer.findById(customerId);
		if (!customer) throw new Error("Customer not found");

		if (!customer.wishlist.includes(bookId)) {
			customer.wishlist.push(bookId);
			await customer.save();
		}

		return customer;
	}

	static async removeFromWishlist(customerId, bookId) {
		const customer = await Customer.findById(customerId);
		if (!customer) throw new Error("Customer not found");

		customer.wishlist = customer.wishlist.filter((id) => !id.equals(bookId));
		await customer.save();

		return customer;
	}

	static async getWishlist(customerId) {
		const customer = await Customer.findById(customerId).populate("wishlist", "title author price coverImage averageRating").select("wishlist");

		return customer ? customer.wishlist : [];
	}

	static async addReview(customerId, bookId, rating, reviewText) {
		const customer = await Customer.findById(customerId);
		if (!customer) throw new Error("Customer not found");

		// Check if review already exists
		const existingReview = customer.reviews.find((review) => review.bookId.equals(bookId));
		if (existingReview) {
			existingReview.rating = rating;
			existingReview.reviewText = reviewText;
			existingReview.reviewDate = new Date();
		} else {
			customer.reviews.push({
				bookId,
				rating,
				reviewText,
				reviewDate: new Date(),
			});
		}

		await customer.save();
		return customer;
	}

	static async updateReadingProgress(customerId, bookId, progress, status) {
		const customer = await Customer.findById(customerId);
		if (!customer) throw new Error("Customer not found");

		const reading = customer.readingList.find((item) => item.bookId.equals(bookId));
		if (reading) {
			reading.progress = progress;
			reading.status = status || reading.status;
			if (status === "completed" && !reading.completedAt) {
				reading.completedAt = new Date();
			}
		} else {
			customer.readingList.push({
				bookId,
				progress,
				status: status || "currently-reading",
				startedAt: new Date(),
			});
		}

		await customer.save();
		return customer;
	}

	// Publisher-specific methods

	static async getPublisherProfile(authorId) {
		const author = await Publisher.findById(authorId).select("-password").populate("publishedBooks", "title coverImage averageRating publishedDate");

		if (!author) return null;

		const profile = author.toObject();
		profile.displayName = author.getDisplayName();
		profile.avatarDisplay = author.getAvatarDisplay();

		return profile;
	}

	static async updatePublisherEarnings(authorId, amount) {
		const author = await Publisher.findById(authorId);
		if (!author) throw new Error("Publisher not found");

		author.earnings.totalEarnings += amount;
		author.earnings.currentMonthEarnings += amount;
		author.earnings.pendingPayment += amount;
		await author.save();

		return author;
	}

	static async processPublisherPayment(authorId, amount) {
		const author = await Publisher.findById(authorId);
		if (!author) throw new Error("Publisher not found");

		if (author.earnings.pendingPayment < amount) {
			throw new Error("Insufficient funds for payment");
		}

		author.earnings.pendingPayment -= amount;
		author.earnings.lastPaymentDate = new Date();
		await author.save();

		return author;
	}

	static async verifyPublisher(authorId, documentsSubmitted = true) {
		const author = await Publisher.findById(authorId);
		if (!author) throw new Error("Publisher/author not found");

		author.authorVerification.isVerified = true;
		author.authorVerification.verificationDate = new Date();
		author.authorVerification.documentsSubmitted = documentsSubmitted;
		await author.save();

		return author;
	}

	// Admin-specific methods
	static async assignPermission(adminId, permission) {
		const admin = await Admin.findById(adminId);
		if (!admin) throw new Error("Admin not found");

		if (!admin.permissions.includes(permission)) {
			admin.permissions.push(permission);
			await admin.save();
		}

		return admin;
	}

	static async revokePermission(adminId, permission) {
		const admin = await Admin.findById(adminId);
		if (!admin) throw new Error("Admin not found");

		admin.permissions = admin.permissions.filter((p) => p !== permission);
		await admin.save();

		return admin;
	}

	// Email verification methods
	static async markEmailVerified(userId) {
		const result = await User.findByIdAndUpdate(
			userId,
			{
				emailVerified: true,
				updatedAt: new Date(),
			},
			{ new: true }
		);

		return result;
	}

	static async markPhoneVerified(userId) {
		const result = await User.findByIdAndUpdate(
			userId,
			{
				phoneVerified: true,
				updatedAt: new Date(),
			},
			{ new: true }
		);

		return result;
	}

	// Cleanup methods
	static async deleteInactiveUsers(daysInactive = 365) {
		const cutoffDate = new Date();
		cutoffDate.setDate(cutoffDate.getDate() - daysInactive);

		const result = await User.deleteMany({
			isActive: false,
			updatedAt: { $lt: cutoffDate },
		});

		return result.deletedCount;
	}
}

module.exports = UserService;
