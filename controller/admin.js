const sellerApplication = require("../models/sellerSchema");
const Category = require("../models/categorySchema");
const Order = require("../models/orderSchema");
const User = require("../models/user");
const Product = require("../models/productSchema");
const Slider = require("../models/sliderSchema")
const SendEmail = require("../utils/sendEmail");





async function handleallsellerRequests(req, res) {
  try {
    const allRequests = await sellerApplication.find({isShopApproved:false});
    
    res.status(200).json({
        success:true,
        message:"seller requests fetch successfully",
        allRequests,

    })
  } catch (err) {
    res.status(500).json({
        message:"internal server error",
        success:false,
    })
  }
}


async function handleAddCategory(req,res){
  try{
    let {name} = req.body;

    // cleaning name
    const nameTrimmed = name.trim().toLowerCase();

    // check if category already exists
    const exists = await Category.findOne({name: nameTrimmed});
    if(exists){
      return res.status(400).json({
        success:false,
        message:"Category already exists"
      });
    }

    // now use nameTrimmed when creating
    const category = await Category.create({name: nameTrimmed});
       
    res.status(200).json({
      success:true,
      message:"category added successfully",
      category,
    })

  }catch(err){
    console.error("Error in handleAddCategory:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}


async function getAllCategories(req,res){
  try{
    const categories = await Category.find();
    res.json({
      success:true,
      categories
    })
  }catch(err){
    res.status(500).json({success:false,message:"server error"})
  }
}

async function handleDeleteCategory(req,res){
  try{
    const deletedCategory = await Category.findByIdAndDelete(req.params.id);

    if(!deletedCategory){
      return res.status(404).json({
        success:false,
        message:"category not found"
      })
    } 
    res.status(200).json({
      success:true,
      message:"category deleted successfully"
    })  
  }catch(err){
    console.error("Error in handleDeleteCategory:", err);
  }}


  const getAllSellerPayments = async (req, res) => {
  try {
    const sellers = await sellerApplication.find({ isShopApproved: true }).populate("userId");

    let sellerPayments = [];

    for (const seller of sellers) {
      const orders = await Order.find({
        "items.seller": seller._id,
        status: "Delivered",
        isCODSettled: true,
      });

      let total = 0;
      let totalPlatformFee = 0;
      let totalSellerEarning = 0;
      let ordersCount = 0;

      orders.forEach(order => {
        order.items.forEach(item => {
          if (item.seller.toString() === seller._id.toString() && item.sellerPaymentStatus === "Pending") {
            
            const itemTotal = item.price * item.quantity;

            // NEW 10% platform fee
            const platformFee = itemTotal * 0.10;  // 10% cut

            total += itemTotal;
            totalPlatformFee += platformFee;
            totalSellerEarning += (itemTotal - platformFee);
            ordersCount += 1;
          }
        });
      });

      sellerPayments.push({
        sellerId: seller._id,
        shopName: seller.shopName,
        ownerName: seller.userId?.name,
        email: seller.contact,
        paymentMethod: seller.paymentInfo.method,
        accountHolder: seller.paymentInfo.accountHolder,
        accountNumber: seller.paymentInfo.accountNumber,
        bankName: seller.paymentInfo.bankName,

        ordersCount,
        totalAmount: total,
        totalPlatformFee,
        sellerEarning: totalSellerEarning,
      });
    }

    res.json({ success: true, sellers: sellerPayments });

  } catch (err) {
    console.error("Error in getAllSellerPayments:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const markSellerPaymentAsPaid = async (req, res) => {
  try {
    const { sellerId } = req.params;

    const orders = await Order.find({
      "items.seller": sellerId,
      status: "Delivered",
      isCODSettled: true,
      "items.sellerPaymentStatus": "Pending",
    });

    for (const order of orders) {
      order.items.forEach(item => {
        if (item.seller.toString() === sellerId && item.sellerPaymentStatus === "Pending") {
          item.sellerPaymentStatus = "Paid";
          item.sellerPaymentDate = new Date();
        }
      });
      await order.save();
    }

    res.json({ success: true, message: "Seller payment marked as Paid" });

  } catch (err) {
    console.error("Error in markSellerPaymentAsPaid:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};




// ========================
// 1️⃣ Get Dashboard Stats
// ========================
const getDashboardStats = async (req, res) => {
  try {
    // Total users
    const totalUsers = await User.countDocuments({ role: "user" });

    // Total sellers
    const totalSellers = await User.countDocuments({ role: "seller" });

    // Total orders
    const totalOrders = await Order.countDocuments();

    // Pending orders (status = null)
    const pendingOrders = await Order.countDocuments({"items.sellerStatus": "Pending" });

    // Total earnings (10% commission)
    const earningsAgg = await Order.aggregate([
      { $unwind: "$items" },
      { $match: { "items.sellerPaymentStatus": "Paid" } },
      {
        $group: {
          _id: null,
          totalCommission: { $sum: { $multiply: ["$items.price", "$items.quantity", 0.10] } }
        }
      }
    ]);

    const totalEarnings = earningsAgg[0]?.totalCommission || 0;

    return res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalSellers,
        totalOrders,
        pendingOrders,
        totalEarnings,
      },
    });

  } catch (err) {
    console.error("Error fetching dashboard stats:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ========================
// 2️⃣ Get Latest Orders
// ========================
const getLatestOrders = async (req, res) => {
  try {
    const latestOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("user", "name email");

    return res.status(200).json({ success: true, orders: latestOrders });

  } catch (err) {
    console.error("Error fetching latest orders:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ========================
// 3️⃣ Get Latest Users
// ========================
const getLatestUsers = async (req, res) => {
  try {
    const latestUsers = await User.find({ role: "user" })
      .sort({ createdAt: -1 })
      .limit(5);

    return res.status(200).json({ success: true, users: latestUsers });

  } catch (err) {
    console.error("Error fetching latest users:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};


const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().lean();
    res.json({ success: true, users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const getUserDetailsById = async (req, res) => {
  try {
    const userId = req.params.id;
    let user = await User.findById(userId).lean();
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (user.role === "seller") {
      const shop = await sellerApplication.findOne({ userId }).lean();
      if (shop) user = { ...user, shop };  // merge shop info into user
    }

    res.json({ success: true, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const deleteUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    await User.findByIdAndDelete(userId);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


const unApprovedProducts = async (req,res)=> {
  try{
    const products = await Product.find({isApproved:false});

      res.status(200).json({
        success:true,
        message:"products fetch successfully",
        products,
      })

  }catch(err){
   res.status(500).json({
    message:"internal server error",
    success:false,
   })
  }
}

// controllers/adminProductController.js
 const approveProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

   product.isApproved = true;

    await product.save();

    res.json({
      success: true,
      message: "Product approved successfully"
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const rejectProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.productId);

    const seller = await sellerApplication.findById(product.seller);

    

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    await SendEmail(
      seller.contact,
      "Your Product has been rejected",
      `<h1>Your product ${product.name} has been rejected.Please check your product carefully and follows the plateform rules. </h1>`
    )

    res.status(200).json({
      success: true,
      message: "Product rejected"
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


//admin slider api 

 const getSliders = async (req, res) => {
  try {
    const sliders = await Slider.find({ isActive: true }).sort({ createdAt: -1 });
    res.status(200).json(sliders);
  } catch (error) {
    console.log("Slider fetch error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

 const createSlider = async (req, res) => {
  try {
    const { link } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;

    if (!image || !link) {
      return res.status(400).json({ message: "Image and link required" });
    }

    const slider = await Slider.create({ image, link });
    res.status(201).json(slider);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
};

const deleteSlider = async (req, res) => {
  try {
    const { id } = req.params;
    await Slider.findByIdAndDelete(id);
    res.status(200).json({ message: "Slider deleted successfully" });
  } catch (error) {
    console.log("Slider delete error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};


module.exports = {
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
  deleteUserById,
  getUserDetailsById,
  unApprovedProducts,
  approveProduct,
  rejectProduct,
  getSliders,
  createSlider,
  deleteSlider,
};

