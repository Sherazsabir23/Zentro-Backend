const express = require("express");
const mongoose = require("mongoose");
const app = express();
const PORT = process.env.PORT || 3000;
const dotenv = require("dotenv");
const userRouter = require("./routes/user");
const sellerRouter = require("./routes/seller");
const adminRouter = require("./routes/admin")
const cartRouter = require("./routes/cart");
const orderRouter = require("./routes/order");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const searchRouter = require("./routes/searchbarapi");
dotenv.config();

app.use(cors({
  origin: "http://localhost:5173",   // your frontend URL
  credentials: true                  // allow cookies / credentials
}));

app.use("/uploads", express.static("uploads"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/api", userRouter);
app.use("/api",sellerRouter);
app.use("/api",adminRouter);
app.use("/api",searchRouter);
app.use("/api",cartRouter);
app.use("/api",orderRouter);


mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

app.listen(PORT, () => {
  console.log(`server running on PORT ${PORT} `);
});
