const mongoose = require("mongoose");


const sellerSchema = new mongoose.Schema({
    userId:{type:mongoose.Schema.Types.ObjectId,ref:"User"},
    shopName:String,
    description:String,
    category:String,
    contact:String,
    isShopApproved:{type:Boolean,default:false},
    paymentInfo: {
    method: { type: String, enum: ["bank", "jazzcash", "easypaisa"], required: true },
    accountHolder: String,
    accountNumber: String,
    bankName: String,
    cnic: String,
  },
     createdAt: { type: Date, default: Date.now },
})





const sellerApplication = mongoose.model("sellerApplication",sellerSchema);


module.exports = sellerApplication;