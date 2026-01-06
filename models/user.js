const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
  },

  password: {
    type: String,
    required: true,
  },
  profileImage: {
    type: String,
    default: "",
  },
  role: {
    type: String,
    enum: ["user", "admin","seller"],
    default: "user",
    },

  createdAt: {
    type: Date,
    default: Date.now,
  },

  otp:{
    type:String,
  },
  isVerified:{
    type:Boolean,
    default:false
  },

  otpExpiry: {
  type: Date
},

address:{
  type:String,
  default:""
},
phone:{
  type:Number,
  default:""
},

watchedCategories: {
  type: [String],
  default: [] // agar user ne koi category nahi dekhi to empty array
},

viewedPosts: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product"
  }
]

},{timestamps:true});




// 🔐 Hash password before saving
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

// 🔐 Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error("Error comparing passwords");
  }
};

const User = mongoose.model("User", userSchema);

module.exports = User;
