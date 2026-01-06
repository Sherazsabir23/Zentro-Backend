const sellerApplication = require("../models/sellerSchema");
const User = require("../models/user");
const sendEmail = require("../utils/sendEmail");
const Product = require("../models/productSchema");
const Order = require("../models/orderSchema");


/* Seller application controller */
async function handleSellerForm(req, res) {
  try {
    const { shopName, description, category, contact,sellerInfo } = req.body;

    // validation
    if (!shopName || !description || !category || !contact || !sellerInfo) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // check duplicate
    const existingSeller = await sellerApplication.findOne({
      userId: req.user.id,
    });
    if (existingSeller) {
      return res.status(400).json({
        success: false,
        message: "You have already submitted a seller application",
      });
    }

    // create seller request
    const seller = await sellerApplication.create({
      shopName,
      description,
      category,
      contact,
      userId: req.user.id,
      paymentInfo: sellerInfo,
    });

    await sendEmail(
      req.user.email,
      "Your request has been Submit Successfully",
      `<h1>You will be informed under 24 hours about your account</h1>`,
    )
    res.status(200).json({
      success: true,
      message: "Seller Request Sent Successfully",
      seller,
    });
  } catch (err) {
    console.error("Error in handleSellerForm:", err.message);
    res.status(500).json({
      success: false,
      message: "Internal Server Error in handle seller form",
    });
  }
}

async function handleApproved(req, res) {
  try {
    // find the seller application first
    const application = await sellerApplication.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Seller application not found",
      });
    }
    application.isShopApproved = true;
    await application.save();


    // now update the actual user using userId
    const user = await User.findById(application.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.role = "seller";
    await user.save();

   
    
    await sendEmail(
      application.contact,
      "Your Seller Account has been approved",
      `<h1>Now you can sell their products on Zentro</h1>`,
    )

    res.status(200).json({
      success: true,
      message: "Seller approved successfully",
      user,
    });
  } catch (err) {
    console.error("Error in approval:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}


async function handleReject(req, res) {
  try {
    const deletedUser = await sellerApplication.findById(req.params.id);

    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        message: "Seller not found or already deleted",
      });
    }

    

    await sendEmail(
      deletedUser.contact,
      "Your Seller Account request has been rejected",
      `<h1>Please try again later or contact to help center for more information</h1>`
    );

    await sellerApplication.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Seller request rejected successfully",
    });
  } catch (err) {
    console.error("Error in rejection:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}



  async function handleproductform(req, res) {
  try {

    const {
      productname,
      productprice,
      productstock,
      productdescription,
      productcategory,
      productdiscount
    } = req.body;

    const productimages = req.files ? req.files.map((file) => `/uploads/${file.filename}`): [];

    
    // Find the seller application linked to the logged-in user
    const seller = await sellerApplication.findOne({ userId: req.user.id });
    if (!seller) {
      return res.status(400).json({
        success: false,
        message: "Seller profile not found. Please apply as a seller first.",
      });
    }

    const product = await Product.create({
      seller: seller.id,
      productname,
      productprice,
      productstock,
      productdescription,
      productcategory,
      productimages,
      productdiscount
    });

    res.status(200).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (err) {
    console.error("Error in handleproductform:", err.message, err.stack);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}


const getDashboardMetrics = async (req, res) => {
  try {
    //Find seller's shop
    const sellerApp = await sellerApplication.findOne({ user: req.user._id });
    if (!sellerApp)
      return res.status(404).json({ success: false, message: "Seller shop not found" });

    const sellerId = sellerApp._id;

    //Get all orders for this seller shop
    const allOrders = await Order.find({ "items.seller": sellerId });

    const totalOrders = allOrders.length;

    //Orders by status (per item OR admin updated order.status)
    const pendingOrders = allOrders.filter(o =>
      o.items.some(
        i =>
          i.seller.toString() === sellerId.toString() &&
          i.sellerStatus === "Pending"
      )
    ).length;

    const processingOrders = allOrders.filter(o =>
      o.items.some(
        i =>
          i.seller.toString() === sellerId.toString() &&
          i.sellerStatus === "Processing"
      )
    ).length;

    const readyForShippedOrders = allOrders.filter(o =>
      o.items.some(
        i =>
          i.seller.toString() === sellerId.toString() &&
          i.sellerStatus === "ReadyForShipped"
      )
    ).length;

    const shippedOrders = allOrders.filter(o =>
      o.items.some(
        i =>
          i.seller.toString() === sellerId.toString() &&
          (i.sellerStatus === "Shipped" || o.status === "Shipped")
      )
    ).length;

    const deliveredOrders = allOrders.filter(o =>
      o.items.some(
        i =>
          i.seller.toString() === sellerId.toString() &&
          (i.sellerStatus === "Delivered" || o.status === "Delivered")
      )
    ).length;

    //Total sales (only admin-paid items with 10% commission deducted)
    const totalSales = allOrders.reduce((acc, order) => {
      const sellerItems = order.items.filter(
        i =>
          i.seller.toString() === sellerId.toString() &&
          i.sellerPaymentStatus === "Paid"
      );
      const sum = sellerItems.reduce((s, i) => s + i.price * i.quantity * 0.9, 0); // 10% commission
      return acc + sum;
    }, 0);

    //Monthly sales (last 6 months, only admin-paid items)
    const months = [];
    const monthlySales = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const monthOrders = allOrders.filter(o => {
        const created = new Date(o.createdAt);
        return created >= start && created <= end;
      });

      const monthSale = monthOrders.reduce((acc, order) => {
        const sellerItems = order.items.filter(
          i =>
            i.seller.toString() === sellerId.toString() &&
            i.sellerPaymentStatus === "Paid"
        );
        const sum = sellerItems.reduce((s, i) => s + i.price * i.quantity * 0.9, 0);
        return acc + sum;
      }, 0);

      months.push(start.toLocaleString("default", { month: "short" }));
      monthlySales.push(monthSale);
    }

    res.json({
      success: true,
      totalOrders,
      pendingOrders,
      processingOrders,
      readyForShippedOrders,
      shippedOrders,
      deliveredOrders,
      totalSales,
      months,
      monthlySales,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};



// Recent Orders
const getSellerRecentOrders = async (req, res) => {
  try {
    // 1️⃣ Find seller's shop
    const sellerApp = await sellerApplication.findOne({ user: req.user._id });
    if (!sellerApp) return res.status(404).json({ success: false, message: "Seller shop not found" });

    const sellerId = sellerApp._id;

    // 2️⃣ Get last 10 orders for this seller shop
    const orders = await Order.find({ "items.seller": sellerId })
      .populate("user", "name email")
      .populate("items.product", "productname productprice")
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({ success: true, orders });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to fetch orders" });
  }
};

const getSellerEarningsSummary = async (req, res) => {
  try {

    const sellerApp = await sellerApplication.findOne({ user: req.user._id });
    if (!sellerApp) return res.status(404).json({ success: false, message: "Seller shop not found" });

    const sellerId = sellerApp._id;


    const orders = await Order.find({
      "items.seller": sellerId,
      status: "Delivered",
    });

    let pendingAmount = 0;
    let availableAmount = 0;
    let totalPaidAmount = 0;

    orders.forEach(order => {
      order.items.forEach(item => {
        if (item.seller.toString() !== sellerId.toString()) return;

        const itemTotal = item.price * item.quantity;
        const commission = itemTotal * 0.10;
        const sellerEarning = itemTotal - commission;

        // ❌ Admin ne COD settle nahi kiya
        if (!order.isCODSettled) {
          pendingAmount += sellerEarning;
        }

        // ✅ COD settled but seller ko payment nahi hui
        else if (order.isCODSettled && item.sellerPaymentStatus === "Pending") {
          availableAmount += sellerEarning;
        }

        // ✅ Payment done
        else if (item.sellerPaymentStatus === "Paid") {
          totalPaidAmount += sellerEarning;
        }
      });
    });

    res.json({
      success: true,
      pendingAmount,
      availableAmount,
      totalPaidAmount,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


const getSellerPaymentHistory = async (req, res) => {
  try {
    const orders = await Order.find({
      items: { $elemMatch: { sellerPaymentStatus: "Paid" } }
    })
      .sort({ updatedAt: -1 })
      .populate("items.seller", "shopName contact paymentInfo");

    let history = [];

    orders.forEach(order => {
      order.items.forEach(item => {
        if (item.sellerPaymentStatus === "Paid" && item.seller) {
          history.push({
            orderId: order._id.toString(),
            sellerId: item.seller._id.toString(),
            shopName: item.seller.shopName,
            email: item.seller.contact,
            paymentMethod: item.seller.paymentInfo?.method || "N/A",
            accountHolder: item.seller.paymentInfo?.accountHolder || "N/A",
            accountNumber: item.seller.paymentInfo?.accountNumber || "N/A",
            bankName: item.seller.paymentInfo?.bankName || "N/A",
            amount: item.price * item.quantity - item.price * item.quantity * 0.10,
            paymentDate: item.sellerPaymentDate || order.updatedAt,
          });
        }
      });
    });

    console.log("Payment history length:", history.length);
    res.json({ success: true, history });

  } catch (err) {
    console.error("Error in getSellerPaymentHistory:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};



// Get seller profile
const getSellerProfile = async (req, res) => {
  try {
     console.log("Logged in user:", req.user);
    const seller = await sellerApplication.findOne({ userId: req.user.id });
     console.log("Found seller:", seller);
    if (!seller) return res.status(404).json({ success: false, message: "Seller not found" });
    
    res.json({ success: true, seller });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Update seller profile
const updateSellerProfile = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const updatedData = req.body;

    const seller = await sellerApplication.findOneAndUpdate(
      { userId: sellerId },
      updatedData,
      { new: true } // <--- ye important hai, updated document return kare
    );

    if (!seller) {
      return res.status(404).json({ success: false, message: "Seller not found" });
    }

    res.json({ success: true, seller }); // <--- seller object return karna
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


module.exports = { handleSellerForm, handleApproved, handleReject,handleproductform,
  getDashboardMetrics,
  getSellerRecentOrders,
  getSellerEarningsSummary,
  getSellerPaymentHistory,
  getSellerProfile,
  updateSellerProfile,
};
