const express = require("express");
const router = express.Router();
const CartController = require("../controllers/CartController");

// pag import object, lagi naka curly braces
const {requireAuth, optionalAuth} = require("./middlewares/permissionAuth");

//for adding items on cart

router.get("/", requireAuth, CartController.getCart);

router.post("/add", optionalAuth, CartController.addToCart);

router.post("/update", optionalAuth, CartController.updateQuantity);

router.post("/remove", optionalAuth, CartController.removeFromCart);

router.post("/clear", optionalAuth, CartController.clearCart);

router.post("/merge", requireAuth, CartController.mergeGuestCart);
module.exports = router;
