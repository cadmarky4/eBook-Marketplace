const jwt = require("jsonwebtoken"); //? Fixing right now
const User = require("../../models/User");

// REQUIRED AUTHENTICATION - Route fails if no valid token
const requireAuth = async (req, res, next) => {
	try {
		console.log("Auth middleware checking...");

		// Get token from Authorization header
		const authHeader = req.header("Authorization");

		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			console.log("No bearer token provided");
			return res.status(401).json({
				success: false,
				error: "Authentication required",
			});
		}

		// Extract token from 'Bearer <token>'
		const token = authHeader.substring(7);

		try {
			// Verify token is valid
			const decoded = jwt.verify(token, process.env.JWT_SECRET);
			console.log("Token verified for user ID:", decoded.userId);

			const user = await User.findById(decoded.userId);
			if (!user) {
				return res.status(401).json({
					success: false,
					error: "User not found",
				});
			}
			req.user = user; // Attach the full user object
			next();
		} catch (error) {
			console.error("JWT verification failed:", error.message);
			return res.status(401).json({
				success: false,
				error: "Invalid token: " + error.message,
			});
		}
	} catch (error) {
		console.error("Auth middleware error:", error);
		return res.status(500).json({
			success: false,
			error: "Server error",
		});
	}
};

// OPTIONAL AUTHENTICATION - Sets req.user if token exists, but doesn't fail if not
const optionalAuth = async (req, res, next) => {
	try {
		const authHeader = req.header("Authorization");
		const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.substring(7) : null;

		if (token) {
			const decoded = jwt.verify(token, process.env.JWT_SECRET);
			const user = await User.findById(decoded.userId);

			if (user) {
				req.user = user; // Set user if valid token
			}
		}

		// Always continue, whether token was valid or not
		next();
	} catch (error) {
		// If token is invalid, just continue without setting req.user
		next();
	}
};

// ROLE-BASED AUTHENTICATION - Check if user has specific role
const requireRole = (roles) => {
	return async (req, res, next) => {
		try {
			// First ensure user is authenticated
			if (!req.user) {
				return res.status(401).json({
					success: false,
					error: "Authentication required",
				});
			}

			// Check if user has any of the required roles
			const userRoles = req.user.accountType || [];
			const hasRequiredRole = roles.some((role) => userRoles.includes(role));

			if (!hasRequiredRole) {
				return res.status(403).json({
					success: false,
					error: `Access denied. Required role: ${roles.join(" or ")}`,
				});
			}

			next();
		} catch (error) {
			return res.status(500).json({
				success: false,
				error: "Server error during role verification",
			});
		}
	};
};

// PERMISSION-BASED AUTHENTICATION - Check specific permissions
const requirePermission = (permission) => {
	return async (req, res, next) => {
		try {
			if (!req.user) {
				return res.status(401).json({
					success: false,
					error: "Authentication required",
				});
			}

			// Check if user has the specific permission
			if (!req.user.permissions || !req.user.permissions.includes(permission)) {
				return res.status(403).json({
					success: false,
					error: `Access denied. Required permission: ${permission}`,
				});
			}

			next();
		} catch (error) {
			return res.status(500).json({
				success: false,
				error: "Server error during permission verification",
			});
		}
	};
};

module.exports = {
	requireAuth,
	optionalAuth,
	requireRole,
	requirePermission,
};
