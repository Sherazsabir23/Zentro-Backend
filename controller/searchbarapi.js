const Product = require("../models/productSchema");
const User = require("../models/user");
const sellerApplication = require("../models/sellerSchema");


const searchProducts = async (req, res) => {
  try {
    const query = req.query.query; // Get ?query= value from URL

    // agar query empty ho
    if (!query || query.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    // MongoDB search using regex (case-insensitive)
    const products = await Product.find({
      $or: [
        { productname: { $regex: query, $options: "i" } },
        { productdescription: { $regex: query, $options: "i" } },
        { productcategory: { $regex: query, $options: "i" } },
        
      ],
    });

    // agar koi product nahi mila
    if (products.length === 0) {
      return res.json({
        success: true,
        products: [],
        message: "No products found",
      });
    }

    // success response
    res.json({
      success: true,
      products,
    });
  } catch (error) {
    console.error("Error in search controller:", error);
    res.status(500).json({
      success: false,
      message: "Server error while searching products",
    });
  }
};


const productsByCategory = async (req, res) => {
  try {
    const category = req.params.category;

    const products = await Product.find({ productcategory: category });
    res.json({
      success: true,
      products,
    });
  } catch (error) {
    console.error("Error in getProductsByCategory:", error);
  }
};
    

module.exports = {
    searchProducts,
    productsByCategory,
}