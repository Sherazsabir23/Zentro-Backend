const express = require("express");
const upload = require("../utils/upload");
const {
  handleallsellerRequests,
  handleAddCategory,
  getAllCategories,
  handleDeleteCategory,
  getAllSellerPayments,
  markSellerPaymentAsPaid,
  getDashboardStats,
  getLatestOrders,
  getLatestUsers,
  getAllUsers,
  getUserDetailsById,
  deleteUserById,
  unApprovedProducts,
  approveProduct,
  rejectProduct,
  getSliders,
  createSlider,
  deleteSlider,
} = require("../controller/admin");
const router = express.Router();
const { jwtAuthMiddleware } = require("../middleware/authmiddleware");

router.get("/allcategories", getAllCategories);
router.post("/addcategory", handleAddCategory);
router.delete("/deletecategory/:id", handleDeleteCategory);
router.get("/allsellerRequests", handleallsellerRequests);
router.get("/seller-payments", getAllSellerPayments);
router.post("/seller-payments/:sellerId/mark-paid", markSellerPaymentAsPaid);
router.get("/dashboard-stats", getDashboardStats);
router.get("/latest-orders", getLatestOrders);
router.get("/latest-users", getLatestUsers);
router.get("/users", getAllUsers);
router.delete("/user/:id", deleteUserById);
router.get("/user/:id", getUserDetailsById);
router.get("/admin/products/pending", unApprovedProducts);
router.put("/admin/products/approve/:productId", approveProduct);
router.delete("/admin/products/reject/:productId", rejectProduct);
router.get("/sliders", getSliders);
router.post("/sliders",upload.single("image"), createSlider);
router.delete("/sliders/:id", deleteSlider);
module.exports = router;
