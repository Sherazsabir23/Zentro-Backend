const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "sellerApplication",
      required: true, // kis seller ne product banaya
    },

    productname: {
      type: String,
      required: [true, "Please enter product name"],
      trim: true,
    },

    productdescription: {
      type: String,
      required: [true, "Please enter product description"],
    },

    productprice: {
      type: Number,
      required: [true, "Please enter product price"],
    },

    productcategory: {
      type: String,
      required: [true, "Please select a category"],
    },

    productstock: {
      type: Number,
      required: true,
      default: 0,
    },

    productimages: [
      {
        type: String, // store URLs of images
        required: true,
      },
    ],

    productdiscount: {
      type: Number,
      default: 0,
    },



    // ⭐ Average Rating
    averageRating: {
      type: Number,
      default: 0,
    },

    // 💬 Reviews (sirf comments)
    reviews: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        comment: {
          type: String,
          
        },
          rating: {
          type: Number,

          min: 1,
          max: 5, // sirf 1 se 5 tak rating
        },
      },
    ],

    isApproved: {
      type: Boolean,
      default: false,
    },


  },
  { timestamps: true }
);

// ⭐ Average Rating Calculate Function
productSchema.methods.calculateAverageRating = function () {
  if (this.reviews.length === 0) {
    this.averageRating = 0;
  } else {
    const total = this.reviews.reduce((acc, item) => acc + item.rating, 0);
    this.averageRating = (total / this.reviews.length).toFixed(1);
  }

  return this.save();
};

const Product = mongoose.model("Product", productSchema);
module.exports = Product;
