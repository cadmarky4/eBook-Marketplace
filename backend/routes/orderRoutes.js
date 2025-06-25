const express = require("express");
const OrderController = require("../controllers/OrderController");
const router = express.Router();

//Customer routes
//Route for new order
router.post("/", OrderController.createOrder);
//Route for getting all orders of the user
router.get("/my-orders", OrderController.getUserOrders);
//Route for getting order details by ID
router.get("/:orderId", OrderController.getOrderById);
//Route for granting access to the ordered book
router.post("/access/:bookId", OrderController.grantAccess);
//Route for getting the download link
router.get("/download/:bookId", OrderController.getDownloadLink);
//Route for cancelling orders
router.put("/:orderId/cancel", OrderController.cancelOrder);

//Admin routes
//Route for updating order status
router.put("/:orderId/status", OrderController.updateOrderStatus);

/*Route for processing refund status
router.put("/refund/status/:id", OrderController.updateUserRefundStatus);*/

module.exports = router;
