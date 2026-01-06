const express = require("express");
const { handleSignup,handleLogin,verifyOtp,handleMe,handleUserProfile } = require("../controller/user");
const router = express.Router();
const {jwtAuthMiddleware} = require("../middleware/authmiddleware");
const upload = require("../utils/upload");

 
router.put("/userprofile/:id",upload.single("profileImage"),handleUserProfile);
router.post("/signup",handleSignup);
router.post("/login",handleLogin);
router.post("/verifyOtp",verifyOtp);
router.get("/me",jwtAuthMiddleware, handleMe);

module.exports = router;