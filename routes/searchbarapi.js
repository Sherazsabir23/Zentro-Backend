const express = require("express");
const router = express.Router();
const {searchProducts,productsByCategory} =  require("../controller/searchbarapi");

router.get("/search",searchProducts);
router.get("/productsbycategory/:category",productsByCategory);






module.exports = router;