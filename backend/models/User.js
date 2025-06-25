const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const Schema = mongoose.Schema;

// Helper function to prefix schema errors
const addSchemaErrorPrefix = (error) => {
	if (error.name === "ValidationError") {
		for (let field in error.errors) {
			error.errors[field].message = `schemaError: ${error.errors[field].message}`;
		}
	}
	return error;
};

const userSchema = new Schema(
	{
		username: {
			type: String,
			required: true,
			trim: true,
		},
		email: {
			type: String,
			required: true,
			lowercase: true,
			trim: true,
		},
		password: {
			type: String,
			required: true,
		},
		phoneNumber: [
			{
				type: String,
				required: true,
				trim: true,
			},
		],

		fullName: {
			type: String,
			required: true,
			trim: true,
		},

		displayName: {
			type: String,
			default: function () {
				return this.username;
			},
		},

		avatar: {
			type: String, //url path of picture
			default: null,
			validate: {
				validator: function (url) {
					if (!url) return true;
				},
			},
		},
		isActive: {
			type: Boolean,
			default: true,
		},
		emailVerified: {
			type: Boolean,
			default: false,
		},
		phoneVerified: {
			type: Boolean,
			default: false,
		},

		lastLogin: {
			type: Date,
			default: Date.now,
		},
		createdAt: {
			type: Date,
			default: Date.now,
		},
		updatedAt: {
			type: Date,
			default: Date.now,
		},
		accountType: [
			{
				type: String,
				enum: ["Customer", "Publisher", "Admin"],
			},
		],
	},
	{
		timestamps: true,
	}
);

//method to hash password
userSchema.pre("save", async function (next) {
	if (!this.isModified("password")) return next();

	try {
		this.password = await bcrypt.hash(this.password, 12);
		this.updatedAt = new Date();
		next();
	} catch (error) {
		next(error);
	}
});

//method to compare passwords
userSchema.methods.comparePassword = async function (enteredPassword) {
	return bcrypt.compare(enteredPassword, this.password);
};

// Method to get user details without password
userSchema.methods.getUserDetails = function () {
	return {
		id: this._id,
		username: this.username,
		email: this.email,
		phoneNumber: this.phoneNumber,
		displayName: this.displayName,
		avatar: this.avatar,
		isActive: this.isActive,
		emailVerified: this.emailVerified,
		phoneVerified: this.phoneVerified,
		lastLogin: this.lastLogin,
		createdAt: this.createdAt,
		updatedAt: this.updatedAt,
	};
};

userSchema.methods.getEmailOnly = function () {
	return {
		email: this.email,
	};
};

//update phoneNumber
userSchema.methods.updatePhoneNumber = function (newNumber) {
	if (!this.phoneNumber.includes(newNumber)) {
		this.phoneNumber.push(newNumber);
	}
	return this.save();
};

//update displayName
userSchema.methods.updateDisplayName = function (newDisplay) {
	this.displayName = newDisplay;
	this.updatedAt = new Date();
	return this.save();
};

//default avatar
userSchema.methods.getAvatarUrl = function () {
	if (this.avatar) {
		return this.avatar;
	}
	return "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/VK_icons_profile_28.svg/240px-VK_icons_profile_28.svg.png";
};

userSchema.methods.getAvatarDisplay = function () {
	return {
		url: this.getAvatarUrl(),
		hasCustomAvatar: !!this.avatar,
	};
};

// Method to update avatar
userSchema.methods.updateAvatar = function (avatarUrl) {
	this.avatar = avatarUrl;
	this.updatedAt = new Date();
	return this.save();
};

userSchema.methods.updateLastLogin = function () {
	this.lastLogin = new Date();
	this.updatedAt = new Date();
	return this.save();
};

// Method to remove avatar
userSchema.methods.removeAvatar = function () {
	this.avatar = null;
	this.updatedAt = new Date();
	return this.save();
};

const User = mongoose.model("User", userSchema);

// Create discriminator models
//const Customer = User.discriminator("Customer", customerSchema);
//const Publisher = User.discriminator("Publisher", publisherSchema);
//const Admin = User.discriminator("Admin", adminSchema);

module.exports = User;
