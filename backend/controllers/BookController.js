// controllers/bookController.js - HTTP request/response handling
const BookService = require("../services/BookService");
const UserController = require("./UserController");
const mongoose = require("mongoose");

class BookController {
	static async uploadBook(req, res) {
		try {
			const user = req.user;

			// Check if user has publisher permissions
			const isAuthorized = Array.isArray(user.accountType)
			? user.accountType.map(type => type.toLowerCase()).includes("publisher") ||
			user.accountType.map(type => type.toLowerCase()).includes("admin")
			: typeof user.accountType === "string" &&
			(user.accountType.toLowerCase().includes("publisher") ||
			user.accountType.toLowerCase().includes("admin"));

			const Publisher = require("../models/Publisher");
			const publisherProfile = await Publisher.findOne({ user: user._id });
			let authorName;
			if (typeof req.body.authorName === "string" && req.body.authorName.trim()) {
				authorName = req.body.authorName.trim();
			} else {
				authorName = publisherProfile.penName; // Always use pen name if blank
			}


			if (!isAuthorized) {
				return res.status(403).json({ error: "Only publishers and admins can upload books" });
			}

			if (!req.files || !req.files.bookFile) {
				return res.status(400).json({ error: "Book file is required" });
			}

			const bookFile = req.files.bookFile[0];
			const coverImage = req.files.coverImage ? req.files.coverImage[0] : null;

			const fileUrl = `/uploads/books/${bookFile.filename}`;
			const coverImageUrl = coverImage ? `/uploads/covers/${coverImage.filename}` : null;

			// Use the provided authorName, or fallback to penName, then fullName
			const bookData = {
            title: req.body.title,
            category: req.body.category,
            description: req.body.description,
            price: parseFloat(req.body.price),
            file_url: fileUrl,
            cover_image_url: coverImageUrl,
            publication_date: new Date(req.body.publication_date || Date.now()),
            author: {
                name: authorName,
                id: user._id,
            },
            keywords: Array.isArray(req.body.keywords) ? req.body.keywords : req.body.keywords ? [req.body.keywords] : [],
        };

        const book = await BookService.addBook(bookData, user);

		if (publisherProfile) {
    publisherProfile.publishedBooks = publisherProfile.publishedBooks || [];
    publisherProfile.publishedBooks.push(book._id);
    await publisherProfile.save();
}

			res.status(201).json({
				success: true,
				message: "Book uploaded successfully",
				book: {
					id: book._id,
					title: book.title,
					author: book.author.name,
					category: book.category,
				},
			});
		} catch (err) {
			console.error("Error in uploadBook:", err);
			res.status(400).json({ error: err.message });
		}
	}

	static async getNewlyReleasedBooks(req, res) {
		try {
			// Limit parameter for number of books to return
			const limit = parseInt(req.query.limit) || 4;

			const newlyReleasedBooks = await BookService.getNewlyReleasedBooks(limit);

			res.status(200).json({
				success: true,
				books: newlyReleasedBooks,
			});
		} catch (err) {
			console.error("Error fetching newly released books:", err);
			res.status(500).json({ error: err.message });
		}
	}

	static async getTopSellingBooks(req, res) {
		try {
			// Limit parameter for number of books to return
			const limit = parseInt(req.query.limit) || 4;

			const topSellingBooks = await BookService.getTopSellingBooks(limit);

			res.status(200).json({
				success: true,
				books: topSellingBooks,
			});
		} catch (err) {
			console.error("Error fetching top selling books:", err);
			res.status(500).json({ error: err.message });
		}
	}

	static async getMostPopularBooks(req, res) {
		try {
			// Limit parameter for number of books to return
			const limit = parseInt(req.query.limit) || 5;

			const mostPopularBooks = await BookService.getMostPopularBooks(limit);

			res.status(200).json({
				success: true,
				books: mostPopularBooks,
			});
		} catch (err) {
			console.error("Error fetching most popular books:", err);
			res.status(500).json({ error: err.message });
		}
	}

	static async getAllBooks(req, res) {
		try {
			const books = await BookService.getAllBooks();
			res.status(200).json(books);
		} catch (err) {
			res.status(500).json({ error: err.message });
		}
	}

	static async getBookById(req, res) {
		try {
			const book = await BookService.getBookById(req.params.id);
			if (!book) {
				return res.status(404).json({ error: "Book not found" });
			}
			res.status(200).json(book);
		} catch (err) {
			res.status(500).json({ error: err.message });
		}
	}

	static async updateBook(req, res) {
		try {
			const book = await BookService.updateBook(req.params.id, req.body);
			if (!book) {
				return res.status(404).json({ error: "Book not found" });
			}
			res.status(200).json(book);
		} catch (err) {
			res.status(400).json({ error: err.message });
		}
	}

	static async deleteBook(req, res) {
		try {
			const book = await BookService.deleteBook(req.params.id);
			if (!book) {
				return res.status(404).json({ error: "Book not found" });
			}
			res.status(204).send();
		} catch (err) {
			res.status(500).json({ error: err.message });
		}
	}

	//searching books
	static async searchBooks(req, res) {
		try {
			const { query } = req.query;
			if (!query) {
				return res.status(400).json({
					success: false,
					message: "Search query is required",
				});
			}

			const books = await BookService.searchBooks(query);

			res.status(200).json({
				success: true,
				count: books.length,
				data: books,
			});
		} catch (err) {
			res.status(500).json({
				success: false,
				message: "Error searching books",
				error: err.message,
			});
		}
	}

	//category filtering
	static async getBooksByCategory(req, res) {
		try {
			const { category } = req.params;
		} catch (err) {
			res.status(500).json({
				success: false,
				message: "Error getting book category",
				error: err.message,
			});
		}
	}

	//get books by author
	static async getBooksByAuthor(req, res) {
		try {
			const { authorName } = req.params;
			if (!authorName) {
				return res.status(400).json({ error: "Author name is required" });
			}
			const books = await BookService.getBooksByAuthor(authorName);
			if (!books || books.length === 0) {
				return res.status(404).json({ error: "No books found for this author" });
			}
		} catch (err) {
			res.status(500).json({
				success: false,
				message: "Error getting books by author",
				error: err.message,
			});
		}
	}

	//get books by keyword or tags
	static async getBooksByKeyword(req, res) {
		try {
			const { keyword } = req.query;
			if (!keyword) {
				return res.status(400).json({ error: "Keyword is required" });
			}
			const books = await BookService.getBooksByKeyword(keyword);
			if (!books || books.length === 0) {
				return res.status(404).json({ error: "No books found for this keyword" });
			}
			res.status(200).json(books);
		} catch (err) {
			res.status(500).json({
				success: false,
				message: "Error getting books by keyword",
				error: err.message,
			});
		}
	}

	//get books by publication date
	static async getBooksByPublicationDate(req, res) {
		try {
			const { date } = req.query;
			if (!date) {
				return res.status(400).json({ error: "Publication date is required" });
			}
			const books = await BookService.getBooksByPublicationDate(new Date(date));
			if (!books || books.length === 0) {
				return res.status(404).json({ error: "No books found for this publication date" });
			}
			res.status(200).json(books);
		} catch (err) {
			res.status(500).json({
				success: false,
				message: "Error getting books by publication date",
				error: err.message,
			});
		}
	}

	//get books by rating
	static async getBooksByRating(req, res) {
		try {
			const { minRating, maxRating, rating } = req.query;

			// Handle different parameter scenarios
			let min, max;

			if (rating) {
				// Single rating parameter - treat as "this rating and above"
				min = parseFloat(rating);
				max = 5.0; // Assuming 5 is the maximum rating
			} else if (minRating && maxRating) {
				// Range query with both parameters
				min = parseFloat(minRating);
				max = parseFloat(maxRating);
			} else if (minRating && !maxRating) {
				// Only minRating provided - treat as "this rating and above"
				min = parseFloat(minRating);
				max = 5.0;
			} else {
				return res.status(400).json({
					error: "Either 'rating', 'minRating', or both 'minRating' and 'maxRating' are required",
					examples: {
						singleRating: "?rating=3 (returns 3-5 star books)",
						minOnly: "?minRating=3 (returns 3-5 star books)",
						range: "?minRating=2&maxRating=4 (returns 2-4 star books)",
					},
				});
			}

			// Validate numeric values
			if (isNaN(min) || isNaN(max)) {
				return res.status(400).json({
					error: "Rating values must be valid numbers",
				});
			}

			// Validate rating range (assuming 1-5 scale)
			if (min < 1 || min > 5 || max < 1 || max > 5) {
				return res.status(400).json({
					error: "Rating values must be between 1 and 5",
				});
			}

			// Ensure min <= max
			if (min > max) {
				return res.status(400).json({
					error: "minRating cannot be greater than maxRating",
				});
			}

			const books = await BookService.getBooksByRating(min, max);

			if (!books || books.length === 0) {
				return res.status(404).json({
					error: `No books found with ratings between ${min} and ${max}`,
				});
			}

			res.status(200).json({
				success: true,
				count: books.length,
				ratingRange: { min, max },
				data: books,
			});
		} catch (err) {
			res.status(500).json({
				success: false,
				message: "Error getting books by rating",
				error: err.message,
			});
		}
	}

	// get books by price range
	static async getBooksByPriceRange(req, res) {
		try {
			const { minPrice, maxPrice } = req.query;
			if (!minPrice || !maxPrice) {
				return res.status(400).json({ error: "Both minPrice and maxPrice are required" });
			}
			const books = await BookService.getBooksByPriceRange(parseFloat(minPrice), parseFloat(maxPrice));
			if (!books || books.length === 0) {
				return res.status(404).json({ error: "No books found in this price range" });
			}
			res.status(200).json(books);
		} catch (err) {
			res.status(500).json({
				success: false,
				message: "Error getting books by price range",
				error: err.message,
			});
		}
	}

	//multiple criteria filtering
	static async filterBooks(req, res) {
		try {
			const { category, author, keyword, publicationDate, rating, minPrice, maxPrice } = req.query;

			const filters = {
				category,
				author,
				keyword,
				publicationDate: publicationDate ? new Date(publicationDate) : null,
				rating: rating ? parseFloat(rating) : null,
				minPrice: minPrice ? parseFloat(minPrice) : null,
				maxPrice: maxPrice ? parseFloat(maxPrice) : null,
			};

			const books = await BookService.getBooksByCriteria(filters);

			res.status(200).json({
				success: true,
				count: books.length,
				data: books,
			});
		} catch (err) {
			res.status(500).json({
				success: false,
				message: "Error filtering books",
				error: err.message,
			});
		}
	}

	// get all categies
	static async getAllCategories(req, res) {
		try {
			const categories = await BookService.getAllCategories();
			res.status(200).json(categories);
		} catch (err) {
			res.status(500).json({ error: err.message });
		}
	}

	static async getMyBooks(req, res) {
        try {
            const publisherId = req.user._id || req.user.id;
            // Find books where author.id matches the publisher's user ID
            const books = await require("../models/Book").find({ "author.id": publisherId });
            res.status(200).json({ success: true, books });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }
}

module.exports = BookController;
