const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Set storage destination and filename
/*const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, "uploads/books"); // folder to store uploaded files
	},
	filename: function (req, file, cb) {
		const uniqueName = Date.now() + "-" + file.originalname;
		cb(null, uniqueName);
	},
});

const upload = multer({ storage });
*/

// Ensure upload directories exist
const bookUploadDir = "uploads/books";
const coverUploadDir = "uploads/covers";

if (!fs.existsSync(bookUploadDir)) {
	fs.mkdirSync(bookUploadDir, { recursive: true });
}

if (!fs.existsSync(coverUploadDir)) {
	fs.mkdirSync(coverUploadDir, { recursive: true });
}

// Set storage destination and filename
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		// Different destinations based on field name
		if (file.fieldname === "bookFile") {
			cb(null, bookUploadDir);
		} else if (file.fieldname === "coverImage") {
			cb(null, coverUploadDir);
		} else {
			cb(new Error("Invalid field name for file upload"));
		}
	},
	filename: function (req, file, cb) {
		const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9) + path.extname(file.originalname);
		cb(null, uniqueName);
	},
});

// Add file filter for validation
const fileFilter = (req, file, cb) => {
	if (file.fieldname === "bookFile") {
		// Allow PDF and EPUB for books
		if (file.mimetype === "application/pdf" || file.mimetype === "application/epub+zip") {
			cb(null, true);
		} else {
			cb(new Error("Only PDF and EPUB files are allowed for books"), false);
		}
	} else if (file.fieldname === "coverImage") {
		// Allow image formats for covers
		if (file.mimetype.startsWith("image/")) {
			cb(null, true);
		} else {
			cb(new Error("Only image files are allowed for cover images"), false);
		}
	} else {
		cb(new Error("Unexpected field"), false);
	}
};

const upload = multer({
	storage,
	fileFilter,
	limits: {
		fileSize: 50 * 1024 * 1024, // 50MB max file size
	},
});

module.exports = upload;
