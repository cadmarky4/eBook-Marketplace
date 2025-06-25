require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 4000;

// Ensure uploads directories exist
const uploadDirs = ["uploads", "uploads/covers", "uploads/books", "uploads/avatars"];
uploadDirs.forEach((dir) => {
	const dirPath = path.join(__dirname, dir);
	if (!fs.existsSync(dirPath)) {
		fs.mkdirSync(dirPath, { recursive: true });
		console.log(`Created directory: ${dirPath}`);
	}
});
// IMPORTANT: Add a special debug route to identify the issue
app.get("/debug-image/:filename", (req, res) => {
	const filePath = path.join(__dirname, "uploads", "covers", req.params.filename);
	if (fs.existsSync(filePath)) {
		// Send the file directly as a binary stream
		const fileStream = fs.createReadStream(filePath);
		if (req.params.filename.endsWith(".png")) {
			res.setHeader("Content-Type", "image/png");
		} else if (req.params.filename.endsWith(".jpg") || req.params.filename.endsWith(".jpeg")) {
			res.setHeader("Content-Type", "image/jpeg");
		}
		fileStream.pipe(res);
	} else {
		res.status(404).send("File not found");
	}
});

// Middleware
app.use(
	cors({
		origin: "http://localhost:3000",
		credentials: true,
	})
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static file middleware - MUST be before route handlers
app.use(
	"/uploads",
	express.static(path.join(__dirname, "uploads"), {
		setHeaders: (res, filePath) => {
			if (filePath.endsWith(".png")) {
				res.setHeader("Content-Type", "image/png");
			} else if (filePath.endsWith(".jpg") || filePath.endsWith(".jpeg")) {
				res.setHeader("Content-Type", "image/jpeg");
			}
		},
	})
);

// Test route for static file serving
app.get("/test-static", (req, res) => {
	res.send(`
    <h1>Static File Test</h1>
    <p>Testing if static files are served correctly</p>
    <p>Upload directory exists: ${fs.existsSync(path.join(__dirname, "uploads/covers")) ? "Yes" : "No"}</p>
    <p>Files in directory: ${fs.readdirSync(path.join(__dirname, "uploads/covers")).join(", ")}</p>
  `);
});

// File check route
app.get("/check-file/:filename", (req, res) => {
	const filePath = path.join(__dirname, "uploads", "covers", req.params.filename);
	const exists = fs.existsSync(filePath);

	let fileInfo = {};
	if (exists) {
		try {
			const stats = fs.statSync(filePath);
			fileInfo = {
				size: stats.size,
				created: stats.birthtime,
				modified: stats.mtime,
				isFile: stats.isFile(),
			};
		} catch (err) {
			fileInfo = { error: err.message };
		}
	}

	res.send({
		fileRequested: req.params.filename,
		fullPath: filePath,
		exists: exists,
		fileInfo: fileInfo,
	});
});

// Import routes
const userRoutes = require("./routes/userRoute");
const publisherRoutes = require("./routes/publisherRoutes");
const bookRoutes = require("./routes/bookRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

// Route handlers
app.use("/api/user", userRoutes);
app.use("/api/publisher", publisherRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/order", orderRoutes);
app.use("/api/payment", paymentRoutes);

// Manual file serving route as fallback
app.get("/manual-serve/covers/:filename", (req, res) => {
	const filePath = path.join(__dirname, "uploads", "covers", req.params.filename);

	if (!fs.existsSync(filePath)) {
		return res.status(404).send("File not found");
	}

	// Determine content type
	let contentType = "application/octet-stream";
	if (req.params.filename.endsWith(".png")) {
		contentType = "image/png";
	} else if (req.params.filename.endsWith(".jpg") || req.params.filename.endsWith(".jpeg")) {
		contentType = "image/jpeg";
	}

	res.setHeader("Content-Type", contentType);
	fs.createReadStream(filePath).pipe(res);
});

// Connect to MongoDB and start server
mongoose
	.connect(process.env.MONGO_URI || "mongodb://localhost:27017/ebookmarketplace")
	.then(() => {
		console.log("Connected to MongoDB");
		app.listen(PORT, () => {
			console.log(`Server running on port ${PORT}`);
		});
	})
	.catch((err) => {
		console.error("MongoDB connection error:", err);
		process.exit(1);
	});
