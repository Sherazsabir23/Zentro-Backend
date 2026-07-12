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

router.get("/allcategories",jwtAuthMiddleware, getAllCategories);
router.post("/addcategory",jwtAuthMiddleware, handleAddCategory);
router.delete("/deletecategory/:id", handleDeleteCategory);
router.get("/allsellerRequests",jwtAuthMiddleware, handleallsellerRequests);
router.get("/seller-payments",jwtAuthMiddleware, getAllSellerPayments);
router.post("/seller-payments/:sellerId/mark-paid",jwtAuthMiddleware, markSellerPaymentAsPaid);
router.get("/dashboard-stats",jwtAuthMiddleware, getDashboardStats);
router.get("/latest-orders",jwtAuthMiddleware, getLatestOrders);
router.get("/latest-users",jwtAuthMiddleware, getLatestUsers);
router.get("/users",jwtAuthMiddleware, getAllUsers);
router.delete("/user/:id",jwtAuthMiddleware, deleteUserById);
router.get("/user/:id",jwtAuthMiddleware, getUserDetailsById);
router.get("/admin/products/pending",jwtAuthMiddleware, unApprovedProducts);
router.put("/admin/products/approve/:productId", jwtAuthMiddleware,approveProduct);
router.delete("/admin/products/reject/:productId", jwtAuthMiddleware,rejectProduct);
router.get("/sliders",jwtAuthMiddleware, getSliders);
router.post("/sliders",upload.single("image"), createSlider);
router.delete("/sliders/:id",jwtAuthMiddleware, deleteSlider);

router.get("/checkadminrole", jwtAuthMiddleware, (req, res) => {
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ success: false, message: "Access denied. Not a admin." });
  }
  res
    .status(200)
    .json({ success: true, message: "Welcome seller!", user: req.user });
});
module.exports = router;
