//import mongoose -jaft
const mongoose = require("mongoose");

// Admin Schema - extends base user
const adminSchema = new mongoose.Schema({
	// Admin-specific fields
	user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

	adminLevel: {
		type: String,
		enum: ["super-admin", "admin", "moderator", "support"],
		required: true,
	},
	permissions: [
		{
			type: String,
			enum: ["user-management", "book-management", "order-management", "content-moderation", "analytics-view", "system-settings", "payment-management", "support-tickets"],
		},
	],
	department: {
		type: String,
		enum: ["operations", "content", "customer-service", "technical", "finance"],
	},
	lastActivity: Date,
	assignedTickets: [
		{
			ticketId: {
				type: mongoose.Schema.Types.ObjectId,
				ref: "SupportTicket",
			},
			assignedDate: {
				type: Date,
				default: Date.now,
			},
		},
	],
	activityLog: [
		{
			action: String,
			target: String,
			targetId: mongoose.Schema.Types.ObjectId,
			timestamp: {
				type: Date,
				default: Date.now,
			},
			ipAddress: String,
		},
	],
});

// Admin-specific methods
adminSchema.methods.hasPermission = function (permission) {
	return this.permissions.includes(permission);
};

adminSchema.methods.logActivity = function (action, target, targetId, ipAddress) {
	this.activityLog.push({
		action,
		target,
		targetId,
		ipAddress,
	});
	this.lastActivity = new Date();
	return this.save();
};

adminSchema.methods.assignTicket = function (ticketId) {
	this.assignedTickets.push({ ticketId });
	return this.save();
};

module.exports = mongoose.model("Admin", adminSchema);
