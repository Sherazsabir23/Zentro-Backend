const express = require("express");
const router = express.Router();
const {createOrder,getUserOrders,getAllOrders,updateOrderItemStatus,updatePaymentStatus,settleCOD,getSellerOrders,updateOrderStatus} = require("../controller/orders");
const {jwtAuthMiddleware} = require("../middleware/authmiddleware");



router.post("/placeorder",jwtAuthMiddleware,createOrder);
router.get("/userorders",jwtAuthMiddleware,getUserOrders);
router.get("/allorders",jwtAuthMiddleware,getAllOrders);
router.put("/updateorderstatus/:id",jwtAuthMiddleware,updateOrderItemStatus);
router.put("/updatepaymentstatus/:id",jwtAuthMiddleware,updatePaymentStatus);
router.get("/sellerorders",jwtAuthMiddleware,getSellerOrders);
router.put("/updateorderstatus",jwtAuthMiddleware,updateOrderStatus);




module.exports = router;
