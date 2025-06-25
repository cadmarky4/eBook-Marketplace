const mongoose = require("mongoose");

// Helper function to prefix schema errors with `schemaError: `
const addSchemaErrorPrefix = (error) => {
	if (error.name === "ValidationError") {
		for (let field in error.errors) {
			error.errors[field].message = `schemaError: ${error.errors[field].message}`;
		}
	}
	return error;
};

const bookSchema = new mongoose.Schema({
	title: { type: String, required: true },
	author: {
		id: { type: mongoose.Schema.Types.ObjectId, ref: "Publisher", required: true },
		name: { type: String, required: true },
	},
	category: { type: String, required: true },
	publication_date: { type: Date, required: true },
	price: { type: Number, required: true },
	keywords: { type: [String], default: [] }, // Array of keywords
	description: { type: String },
	rating: { type: Number, min: 0, max: 5 }, // Rating between 0 and 5
	sales_count: { type: Number, default: 0 }, // top selling
	view_count: { type: Number, default: 0 }, // most popular
	file_url: { type: String, required: true },
	cover_image_url: { type: String }, // Not required
});

// Add a method to get the book's details
bookSchema.methods.getDetails = function () {
	return {
		id: this._id,
		title: this.title,
	};
};

bookSchema.methods.getAuthor = function () {
	return {
		id: this.author.id,
		name: this.author.name,
	};
};

// Add a method to get the book's keywords
bookSchema.methods.getKeywords = function () {
	return this.keywords.join(", ");
};

// Add a method to get the book's publication date in a readable format
bookSchema.methods.getPublicationDate = function () {
	return this.publication_date.toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});
};

// Add a method to get the book's price formatted as currency
bookSchema.methods.getFormattedPrice = function () {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "PHP",
	}).format(this.price);
};

// Add a method to get the book's rating as stars
bookSchema.methods.getRatingStars = function () {
	const fullStars = Math.floor(this.rating);
	const halfStar = this.rating % 1 >= 0.5 ? 1 : 0;
	const emptyStars = 5 - fullStars - halfStar;

	return "★".repeat(fullStars) + (halfStar ? "½" : "") + "☆".repeat(emptyStars);
};

// Add a method to get the book's description truncated to a certain length
bookSchema.methods.getTruncatedDescription = function (length = 100) {
	if (!this.description) return "";
	return this.description.length > length ? this.description.substring(0, length) + "..." : this.description;
};

// Add a method to get the book's file URL
bookSchema.methods.getFileUrl = function () {
	return this.file_url;
};

// Add a method to get the book's category
bookSchema.methods.getCategory = function () {
	return this.category;
};

// Add a method to get the book's publication year
bookSchema.methods.getPublicationYear = function () {
	return this.publication_date.getFullYear();
};

// Add a method to get the book's author ID
bookSchema.methods.getAuthorId = function () {
	return this.author.id;
};

// Create the Book model
const Book = mongoose.model("Book", bookSchema);
module.exports = Book;
