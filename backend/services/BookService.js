const Book = require("../models/Book");
const User = require("../models/User");
const Publisher = require("../models/Publisher");
const mongoose = require("mongoose");

// Helper function to prefix service errors
const prefixServiceError = (error) => {
	if (error instanceof Error) {
		error.message = `serviceError: ${error.message}`;
		return error;
	}
	return new Error(`serviceError: ${error}`);
};

class BookService {
	//create books, for author and admin access only
	static async addBook(bookData, author) {
    try {
        // Create and save the new book
        const newBook = new Book(bookData);
        await newBook.save();

        // Update the publisher's books array if publisher is provided
        if (bookData.author && bookData.author.id) {
            const publisher = await Publisher.findById(bookData.author.id);
            if (publisher) {
                await publisher.addBook(newBook._id);
            }
        }

        return newBook;
    } catch (error) {
        throw prefixServiceError(error);
    }
}

	static async getNewlyReleasedBooks(limit = 4) {
		try {
			const books = await Book.find({})
				.sort({ publication_date: -1 }) // Sort by publication date in descending order
				.limit(limit)
				.lean();

			// Transform the data to match the frontend expectations
			return books.map((book) => ({
				id: "68584967174a26b0af7e8540", // Use a unique ID for each book
				title: book.title,
				author: book.author.name,
				cover: book.cover_image_url || "COVER",
				price: book.price,
				rating: book.rating || 4.0, // Default rating if not available
			}));
		} catch (error) {
			throw prefixServiceError(error);
		}
	}

	static async getTopSellingBooks(limit = 4) {
		try {
			// Assuming you have a sales or downloads field to sort by
			// If not, you might need to create a different sorting mechanism
			const books = await Book.find({}).sort({ sales_count: -1 }).limit(limit).lean();

			// Transform the data to match the frontend expectations
			return books.map((book) => ({
				id: book._id,
				title: book.title,
				author: book.author.name, // Map publisher.name to author for frontend compatibility
				cover: book.cover_image_url || "COVER",
				price: book.price,
				rating: book.rating || 4.0, // Default rating if not available
			}));
		} catch (error) {
			throw prefixServiceError(error);
		}
	}

	static async getMostPopularBooks(limit = 4) {
		const books = await Book.find({}).sort({ view_count: -1 }).limit(limit).lean();
		// Transform the data to match the frontend expectations
		return books.map((book) => ({
			id: book._id,
			title: book.title,
			author: book.author.name, // Map publisher.name to author for frontend compatibility
			cover: book.cover_image_url || "COVER",
			price: book.price,
			rating: book.rating || 4.0, // Default rating if not available
		}));
	}

	// Get all books
	static async getAllBooks() {
		return await Book.find({});
	}

	// Get book by ID
	static async getBookById(id) {
		return await Book.findById(id);
	}

	// Update book
	static async updateBook(id, bookData) {
		return await Book.findByIdAndUpdate(id, bookData, { new: true });
	}

	// Delete book
	static async deleteBook(id) {
		return await Book.findByIdAndDelete(id);
	}

	// Search books by title or author
	static async searchBooks(query) {
		try {
			const regex = new RegExp(query, "i"); // Case-insensitive search
			return await Book.find({
				$or: [{ title: regex }, { "author.name": regex }],
			});
		} catch (error) {
			throw error;
		}
	}

	// Get books by category
	static async getBooksByCategory(category) {
		try {
			return await Book.find({ category });
		} catch (error) {
			throw error;
		}
	}

	// Get books by author
	static async getBooksByAuthor(authorName) {
		try {
			const regex = new RegExp(authorName, "i"); // Case-insensitive search
			return await this.find({ "author.name": regex });
		} catch (error) {
			throw error;
		}
	}

	// Get books by keyword

	static async getBooksByKeyword(keyword) {
		try {
			const regex = new RegExp(keyword, "i"); // Case-insensitive search
			return await Book.find({ keywords: regex });
		} catch (error) {
			throw error;
		}
	}

	// Get books by publication date range
	static async getBooksByPublicationDate(startDate, endDate) {
		try {
			return await Book.find({
				publication_date: {
					$gte: new Date(startDate),
					$lte: new Date(endDate),
				},
			});
		} catch (error) {
			throw error;
		}
	}

	// Get books by rating
	static async getBooksByRating(minRating, maxRating) {
		try {
			return await Book.find({
				rating: {
					$gte: minRating,
					$lte: maxRating,
				},
			});
		} catch (error) {
			throw error;
		}
	}

	// Get books by price range
	static async getBooksByPriceRange(minPrice, maxPrice) {
		try {
			return await Book.find({
				price: {
					$gte: minPrice,
					$lte: maxPrice,
				},
			});
		} catch (error) {
			throw error;
		}
	}

	// Get books by multiple criteria
	static async getBooksByCriteria(criteria) {
		try {
			const query = {};
			if (criteria.title) {
				query.title = new RegExp(criteria.title, "i");
			}
			if (criteria.author) {
				query["author.name"] = new RegExp(criteria.author, "i");
			}
			if (criteria.category) {
				query.category = criteria.category;
			}
			if (criteria.publicationDate) {
				query.publication_date = {
					$gte: new Date(criteria.publicationDate.start),
					$lte: new Date(criteria.publicationDate.end),
				};
			}
			if (criteria.rating) {
				query.rating = {
					$gte: criteria.rating.min,
					$lte: criteria.rating.max,
				};
			}
			if (criteria.price) {
				query.price = {
					$gte: criteria.price.min,
					$lte: criteria.price.max,
				};
			}
			return await Book.find(query);
		} catch (error) {
			throw error;
		}
	}

	static async getAllCategories() {
		try {
			const categories = await Book.distinct("category");
			return categories;
		} catch (error) {
			console.error("Error fetching categories:", error);
			throw error;
		}
	}
}

module.exports = BookService;
