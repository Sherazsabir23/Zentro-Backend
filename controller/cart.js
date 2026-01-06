const Cart = require("../models/cartSchema");

// 1) ADD TO CART
const addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.body;

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      cart = new Cart({
        user: userId,
        items: [{ product: productId, quantity: 1 }]
      });
    } else {
      const item = cart.items.find((i) => i.product.toString() === productId);

      if (item) {
        item.quantity += 1;
      } else {
        cart.items.push({ product: productId, quantity: 1 });
      }
    }

    await cart.save();
    res.status(200).json({success:true,cart});

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 2) GET USER CART
// 2) GET USER CART
const getCart = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const cart = await Cart.findOne({ user: userId }).populate("items.product");

    if (cart) {
      await cart.calculateTotals();
      await cart.save();
    } else {
      return res.status(404).json({ success: false, message: "Cart not found" })
    }

    res.status(200).json({ success: true, cart: cart });
  } catch (err) {
    console.error("GetCart Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};



// 3) UPDATE QUANTITY
const updateQuantity = async (req, res) => {
  try {
    const userId = req.user.id;
    const { itemId } = req.params;
    const { quantity } = req.body;

    const cart = await Cart.findOne({ user: userId });
    const item = cart.items.id(itemId);

    item.quantity = quantity;

    await cart.save();
    res.json({cart,success:true});

  } catch (err) {
    res.status(500).json({ suucess:false, message: err.message });
  }
};

// 4) REMOVE ITEM
const removeItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { itemId } = req.params;

    const cart = await Cart.findOne({ user: userId });

    cart.items = cart.items.filter((i) => i._id.toString() !== itemId);

    await cart.save();

    res.status(200).json({success:true,cart});

  } catch (err) {
    res.status(500).json({msuccess:false, message: err.message });
  }
};

// 5) CLEAR CART
const clearCart = async (req, res) => {
  try {
    const userId = req.user.id;

    const cart = await Cart.findOne({ user: userId });

    cart.items = [];
    await cart.save();

     res.status(200).json({success:true,cart});

  } catch (err) {
    res.status(500).json({ success:false, message: err.message });
  }
};

// EXPORT ALL FUNCTIONS AT END
module.exports = {
  addToCart,
  getCart,
  updateQuantity,
  removeItem,
  clearCart
};
