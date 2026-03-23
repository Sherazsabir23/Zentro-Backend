const Product = require("../models/productSchema");
const User = require("../models/user");
const sellerApplication = require("../models/sellerSchema");


const featuredProducts = async (req, res) => {
  try {
    const products = await Product.aggregate([
      { $match: { isApproved: true } },
      { $sort: { createdAt: -1 } },
      { $limit: 8 },
    ]); // only 8 featured

    res.status(200).json({
      success: true,
      products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load featured products",
    });
  }
};

const productDetails = async (req, res) => {
  const productId = req.params.id;
  try {
    const product = await Product.findById(productId).populate(
      "reviews.user",
      "name email",
      /* "seller.shopName", */
    ).populate("seller", "shopName");

    
    res.status(200).json({
      success: true,
      product,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "server error",
    });
  }
};

const postReviewController = async (req, res) => {
  try {
    const productId = req.params.id;

    const { userId, stars, comment } = req.body;

    if (!userId || !stars || !comment) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    // Find the product
    const product = await Product.findById(productId);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    const alreadyReviewd = product.reviews.find(
      (review) => review.user.toString() === userId
    );

    if (alreadyReviewd) {
      return res
        .status(400)
        .json({
          success: false,
          message: "You have already reviewed this product",
        });
    }

    // Add review and rating
    product.reviews.push({ user: userId, comment, rating: stars });

    // Recalculate average rating using schema method
    await product.calculateAverageRating();

    res
      .status(201)
      .json({ success: true, message: "Review added successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const trackViewController = async (req, res) => {
  try {
    const userId = req.user.id;
    const productId = req.params.id;

    const product = await Product.findById(productId);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Add category to watchedCategories if not already present
    if (!user.watchedCategories.includes(product.productcategory)) {
      user.watchedCategories.push(product.productcategory);
    }

    // Add product to viewedPosts if not already present
    if (!user.viewedPosts) user.viewedPosts = [];
    if (!user.viewedPosts.includes(product._id)) {
      user.viewedPosts.push(product._id);
    }

    await user.save();

    res
      .status(200)
      .json({ success: true, message: "User activity tracked successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const productsForHomeController = async (req, res) => {
  try {
    let products = [];

    if (req.user) {
      // Logged-in: personalized products
      const user = await User.findById(req.user.id);
      
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      const watchedCategories = user.watchedCategories || [];
      const viewedPosts = user.viewedPosts || [];

      // Safe _id filtering
      const viewedIds = (viewedPosts || [])
        .filter(id => id)
        .map(id => {
          try {
            return typeof id === "string" ? new mongoose.Types.ObjectId(id) : id;
          } catch {
            return null;
          }
        })
        .filter(Boolean);

      products = await Product.aggregate([
        {
          $match: {
            productcategory: { $in: watchedCategories },
            isApproved: true,
            _id: { $nin: viewedIds },
          },
        },
        { $sample: { size: 5 } }, // max 5 products
      ]);
    } else {
      // Logged-out: trending products
      products = await Product.find({ isApproved: true })
        .sort({ averageRating: -1, createdAt: -1 })
        .limit(10);
    }

    res.status(200).json({ success: true, products });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const relatedProductsController = async (req, res) => {
  try {
    const productId = req.params.id;

    const currentProduct = await Product.findById(productId);
    if (!currentProduct) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    const relatedProducts = await Product.aggregate([
      {
        $match: {
          productcategory: currentProduct.productcategory, // same category
          isApproved: true,
          _id: { $ne: currentProduct._id }, // exclude current product
        },
      },
      { $sample: { size: 4 } }, // random 5 related products
    ]);

    res.status(200).json({ success: true, products: relatedProducts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


const getSellerProducts = async (req, res) => {
  try {
    const sellerShop = await sellerApplication.findOne({ user: req.user._id });
    if (!sellerShop)
      return res.status(404).json({ success: false, message: "Seller shop not found" });

    const products = await Product.find({ seller: sellerShop._id });

    res.json({ success: true, products });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false });
  }
};

// delete product
const deleteProduct = async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ success: false });
  }
};

const updateSellerProduct = async (req, res) => {
  try {
    const productId = req.params.id;

    const seller = await sellerApplication.findOne({ userId: req.user.id });
    if (!seller) {
      return res.status(404).json({ success: false, message: "Seller not found" });
    }

    const product = await Product.findOne({ _id: productId, seller: seller._id });

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // Update fields
    product.productname = req.body.productname || product.productname;
    product.productprice = req.body.productprice || product.productprice;
    product.productstock = req.body.productstock || product.productstock;
    product.productdescription = req.body.productdescription || product.productdescription;
    product.productcategory = req.body.productcategory || product.productcategory;
    product.productdiscount = req.body.productdiscount || product.productdiscount  ;

    // If new images uploaded
    if (req.files && req.files.length > 0) {
      const images = req.files.map(file => `/uploads/${file.filename}`);
      product.productimages = images;
    }

    await product.save();

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product,
    });

  } catch (error) {
    console.log("Update Product Error", error);
    return res.status(500).json({ success: false, message: "Server error while updating product" });
  }
};

module.exports = {
  featuredProducts,
  productDetails,
  postReviewController,
  trackViewController,
  productsForHomeController,
  relatedProductsController,
  getSellerProducts,
  deleteProduct,
  updateSellerProduct,
};
