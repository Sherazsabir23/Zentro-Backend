const express = require("express");
const {
  handleSellerForm,
  handleApproved,
  handleReject,
  handleproductform,
  getDashboardMetrics,
  getSellerRecentOrders,
  getSellerEarningsSummary,
  getSellerPaymentHistory,
  getSellerProfile,
  updateSellerProfile,
} = require("../controller/seller");
const {
  featuredProducts,
  productDetails,
  postReviewController,
  trackViewController,
  productsForHomeController,
  relatedProductsController,
  getSellerProducts,
  deleteProduct,
  updateSellerProduct,
} = require("../controller/productController");
const router = express.Router();
const {
  jwtAuthMiddleware,
  optionalAuth,
} = require("../middleware/authmiddleware");
const upload = require("../utils/upload");

router.post("/sellerform", jwtAuthMiddleware, handleSellerForm);
router.put("/handleapproved/:id", handleApproved);
router.delete("/handlereject/:id", handleReject);
router.post(
  "/handleproductform",
  jwtAuthMiddleware,
  upload.array("productimage", 5),
  handleproductform
);
router.get("/seller-products", jwtAuthMiddleware, getSellerProducts);
router.put(
  "/update-product/:id",
  jwtAuthMiddleware,
  upload.array("productimage", 5),
  updateSellerProduct
);
router.delete("/delete-product/:id", jwtAuthMiddleware, deleteProduct);
router.get("/featuredproducts", featuredProducts);
router.get("/productdetails/:id", productDetails);
router.post("/postreview/:id", jwtAuthMiddleware, postReviewController);
router.post("/trackview/:id", jwtAuthMiddleware, trackViewController);
router.get("/productsforhome", optionalAuth, productsForHomeController);
router.get("/relatedproducts/:id", relatedProductsController);
router.get("/sellerdashboard-metrics", jwtAuthMiddleware, getDashboardMetrics);
router.get("/orders", jwtAuthMiddleware, getSellerRecentOrders);
// Seller dashboard earnings summary
router.get("/earnings-summary",jwtAuthMiddleware, getSellerEarningsSummary);

// Seller payment history
router.get("/earnings-history",jwtAuthMiddleware, getSellerPaymentHistory);
router.get("/seller/profile",jwtAuthMiddleware, getSellerProfile);
router.put("/seller/profile",jwtAuthMiddleware, updateSellerProfile);

router.get("/checksellerrole", jwtAuthMiddleware, (req, res) => {
  if (req.user.role !== "seller") {
    return res
      .status(403)
      .json({ success: false, message: "Access denied. Not a seller." });
  }
  res
    .status(200)
    .json({ success: true, message: "Welcome seller!", user: req.user });
});
module.exports = router;
