const express = require("express");
const router = express.Router();
const {addToCart,getCart,updateQuantity,removeItem,clearCart}= require("../controller/cart");
const {jwtAuthMiddleware} = require("../middleware/authmiddleware"); 


// 1) ADD TO CART
router.post("/add", jwtAuthMiddleware, addToCart);

// 2) GET USER CART
router.get("/", jwtAuthMiddleware, getCart);

// 3) UPDATE QUANTITY (+ / -)
router.put("/update/:itemId", jwtAuthMiddleware,updateQuantity);

// 4) REMOVE ITEM
router.delete("/remove/:itemId", jwtAuthMiddleware,removeItem);

// 5) CLEAR CART
router.delete("/clear", jwtAuthMiddleware, clearCart);

module.exports = router;
