const Order = require("../models/orderSchema");
const sellerApplication = require("../models/sellerSchema");

const createOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { cartItems, totalAmount, address, paymentMethod } = req.body;

    if (!cartItems || cartItems.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No items in cart" });
    }

    // Prepare order items with seller info & discounted price
    const orderItems = cartItems.map((item) => {
      const product = item.product;
      const discountPercent = product.productdiscount || 0;
      const discountedPrice =
        product.productprice - (product.productprice * discountPercent) / 100;

      return {
        product: product._id,
        seller: product.seller,
        quantity: item.quantity,
        price: discountedPrice, // store discounted price
      };
    });

    const order = await Order.create({
      user: userId,
      items: orderItems,
      totalAmount,
      address,
      paymentMethod,
      paymentStatus: paymentMethod === "COD" ? "Pending" : "Pending", // CARD will update after payment
    });

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const orders = await Order.find({ user: userId })
      .populate(
        "items.product",
        "name productprice productdiscount productimages"
      )
      .populate("items.seller", "name email");

    res.status(200).json({ success: true, orders });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const getSellerOrders = async (req, res) => {
  try {
    const seller = await sellerApplication.findOne({ userId: req.user.id });
    if (!seller) return res.status(404).json({ success: false, message: "Seller not found" });
    const shopId = seller._id;

    const orders = await Order.find({ "items.seller": shopId })
      .populate("user", "name email")
      .populate("items.product", "name productprice productdiscount productimages");

    const sellerOrders = orders.map((order) => {
      const sellerItems = order.items.filter(
        (item) => item.seller.toString() === shopId.toString()
      );

      const sellerTotal = sellerItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      // Merge admin status for each item
      const itemsWithStatus = sellerItems.map((item) => ({
        ...item.toObject(),
        finalStatus:
          ["Shipped", "Delivered"].includes(order.status)
            ? order.status   // Admin updated status
            : item.sellerStatus,  // Seller ka status jab tak admin update na kare
      }));

      return {
        ...order.toObject(),
        items: itemsWithStatus,
        sellerTotal,
      };
    });

    res.status(200).json({ success: true, orders: sellerOrders });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};



const getAllOrders = async (req, res) => {
  try {
    const { status, paymentType, codStatus } = req.query;

    let filter = {};

    // 🔹 Status filter
    if (status && status !== "All") {
      if (status === "ReadyForShipped") {
        // Sirf wo orders jisme at least ek item ka sellerStatus ReadyForShipped ho
        // aur order abhi admin ne Shipped ya Delivered na kiya ho
        filter["items.sellerStatus"] = "ReadyForShipped";
        filter.status = { $nin: ["Shipped", "Delivered"] };
      } else if (status === "Shipped") {
        filter.status = "Shipped";
      } else if (status === "Delivered") {
        filter.status = "Delivered";
      }
    } else {
      // Default: exclude Pending & Processing orders
      filter.status = { $nin: ["Pending", "Processing"] };
    }

    // 🔸 Payment type filter
    if (paymentType && paymentType !== "All") {
      if (paymentType === "Online") {
        filter.paymentMethod = { $ne: "COD" };
      } else {
        filter.paymentMethod = paymentType;
      }
    }

    // 🔹 COD settlement filter
    if (codStatus && codStatus !== "All") {
      filter.isCODSettled = codStatus === "Settled";
    }

    const orders = await Order.find(filter)
      .populate("user", "name email")
      .populate("items.product", "name productprice productimages")
      .populate("items.seller", "shopName");

    res.status(200).json({ success: true, orders });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};




const updateOrderItemStatus = async (req, res) => {
  try {
    const seller = await sellerApplication.findOne({ userId: req.user.id });
    if (!seller) return res.status(404).json({ success: false, message: "Seller not found" });

    const { id } = req.params; // order ID
    const { productId, status } = req.body;

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    // Update only seller's item
    let updated = false;
    order.items = order.items.map((item) => {
      if (item.product.toString() === productId && item.seller.toString() === seller._id.toString()) {
        item.sellerStatus = status;
        updated = true;
      }
      return item;
    });

    if (!updated) return res.status(400).json({ success: false, message: "Item not found for this seller" });

    await order.save();

    res.status(200).json({ success: true, message: "Seller item status updated", order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const updateOrderStatus = async(req,res)=>{
  try{
     const {id,status}= req.body;
     const order = await Order.findById(id);
     if(!order) return res.status(404).json({success:false,message:"order not found"});

     order.status = status;
     await order.save();

     res.status(200).json({success:true,message:"order status updated",order});
  }catch(err){
         console.log("error in updateOrderStatus",err);
         res.status(500).json({success:false,message:"server error"});
  }
  
}


const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id);
    

    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });

        order.isCODSettled = true;
        order.paymentStatus = "Paid";

    await order.save();


    res
      .status(200)
      .json({ success: true, message: "Payment status updated", order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};



module.exports = {
  createOrder,
  getUserOrders,
  getAllOrders,
  updateOrderItemStatus,
  updatePaymentStatus,
  getSellerOrders,
  updateOrderStatus,
  
};
