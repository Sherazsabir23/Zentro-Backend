const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true
  },

  items: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
      },
      quantity: {
        type: Number,
        required: true,
        default: 1
      }
    }
  ],

  totalPrice: {
    type: Number,
    default: 0
  },

  shipping: {
    type: Number,
    default: 200 // default shipping
  },

  discount: {
    type: Number,
    default: 0 // optional extra discount (coupon)
  },

  finalPrice: {
    type: Number,
    default: 0
  }

}, { timestamps: true });


// ===========================
// SCHEMA METHOD: CALCULATE TOTALS
// ===========================
cartSchema.methods.calculateTotals = async function () {
  // 1. Populate product details
  await this.populate("items.product");

  let total = 0;

  // 2. Loop safely
  for (const item of this.items) {
    // agar product populate nahi hua, skip karo
    if (!item.product) continue;

    const price = item.product.productprice || 0;                 // original price
    const discountPercent = item.product.productdiscount || 0;    // seller discount %
    const discountedPrice = price - (price * discountPercent) / 100;

    total += discountedPrice * item.quantity;
  }

  // 3. Update cart totals safely
  this.totalPrice = total;                                 // total after seller discounts
  this.finalPrice = total + (this.shipping || 0) - (this.discount || 0); // add shipping, subtract any coupon
};

module.exports = mongoose.model("Cart", cartSchema);
