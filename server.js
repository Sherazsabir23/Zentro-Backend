const dotenv = require("dotenv");
dotenv.config();

const mongoose = require("mongoose");
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

const userRouter = require("./routes/user");
const sellerRouter = require("./routes/seller");
const adminRouter = require("./routes/admin")
const cartRouter = require("./routes/cart");
const orderRouter = require("./routes/order");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const searchRouter = require("./routes/searchbarapi");
const dns = require("dns");

dns.setServers(["1.1.1.1", "8.8.8.8"]);

app.use(cors({
  origin: "https://zentro-frontend-acwj.vercel.app",   // your frontend URL
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


// Sirf normal text message show karne ke liye
app.get("/", (req, res) => {
  res.send("Zentro Backend is running perfectly! 🚀");
});



mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

app.listen(PORT, () => {
  console.log(`server running on PORT ${PORT} `);
});
