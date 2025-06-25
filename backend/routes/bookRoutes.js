const express = require("express");
const router = express.Router();
const BookController = require("../controllers/BookController");
const { requireAuth } = require("./middlewares/permissionAuth");

// Fix the path to middleware
const upload = require("../routes/middlewares/upload"); // multer config

// Add support for cover image upload
router.post(
	"/upload",
	requireAuth,
	upload.fields([
		{ name: "bookFile", maxCount: 1 },
		{ name: "coverImage", maxCount: 1 },
	]),
	BookController.uploadBook
);

//update book details
router.put(
	"/:id",
	upload.fields([
		{ name: "bookFile", maxCount: 1 },
		{ name: "coverImage", maxCount: 1 },
	]),
	BookController.updateBook
);

//deleting books
router.delete("/:id", BookController.deleteBook);

//for main page
router.get("/newly-released", BookController.getNewlyReleasedBooks);
router.get("/top-selling", BookController.getTopSellingBooks);
router.get("/most-popular", BookController.getMostPopularBooks);

//all categories
router.get("/categories", BookController.getAllCategories);

//search queries
router.get("/search/author", BookController.getBooksByAuthor);
router.get("/search/filter", BookController.filterBooks);
router.get("/search/pub_date/", BookController.getBooksByPublicationDate);
router.get("/search", BookController.searchBooks);
router.get("/category/:category", BookController.getBooksByCategory);
router.get("/search/keyword", BookController.getBooksByKeyword);

router.get("/search/rating", BookController.getBooksByRating);
router.get("/search/price-range", BookController.getBooksByPriceRange);

//get all books
router.get("/", BookController.getAllBooks);

//get book by id
router.get("/:id", BookController.getBookById);

// Get books for the logged-in publisher
router.get("/my", requireAuth, BookController.getMyBooks);


module.exports = router;
