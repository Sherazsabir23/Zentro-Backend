const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    items: [
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "sellerApplication", required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    sellerStatus: { type: String, enum: ["Pending", "Processing", "ReadyForShipped"], default: "Pending" },
    sellerPaymentStatus: { type: String, enum: ["Pending", "Paid"], default: "Pending" },
    sellerPaymentDate: { type: Date, default: null },
  }
],

    totalAmount: {
      type: Number,
      required: true,
    },

    address: {
      fullName: String,
      phone: String,
      street: String,
      city: String,
      country: String,
      postalCode: String,
    },

    paymentMethod: {
      type: String,
      enum: ["COD", "CARD"],
      default: "COD",
    },

    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed", "Refunded"],
      default: "Pending",
    },

    // ✅ Track COD settlement to seller/company
    isCODSettled: {
      type: Boolean,
      default: false,
    },

    // ✅ For CARD payments
    transactionId: {
      type: String,
      default: null,
    },
    status:{
      type:String,
      enum:["Shipped","Delivered",null],
      default:null,
    },
    paymentGateway: {
      type: String,
      enum: ["Stripe", "PayPal", "JazzCash", "EasyPaisa", null],
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
