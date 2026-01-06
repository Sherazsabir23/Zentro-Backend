const jwt = require("jsonwebtoken");

// Middleware to verify token
const jwtAuthMiddleware = (req, res, next) => {
  const token = req.cookies.token; // Token from cookies

  if (!token) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach user payload to request
    next();
  } catch (err) {
    console.log("JWT Error:", err.message);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

// Function to generate token
const generateToken = (userData) => {
  return jwt.sign(userData, process.env.JWT_SECRET, {
    expiresIn: "1d", // ✅ Set expiry (1 day, can change as needed)
  });
};




//role check middlwware 

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role (${req.user.role}) is not allowed to access this resource`,
      });
    }
    next();
  };
};


const optionalAuth = (req, res, next) => {
  const token = req.cookies?.token; // Read token from cookies

  // Token NA ho → user logged out
  if (!token) {
    req.user = null;
    return next();
  }

  try {
    // Token present → decode it
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;     // Attach user data
  } catch (err) {
    // Invalid or expired token → ignore it
    req.user = null;
  }

  next();
};


module.exports = {
  jwtAuthMiddleware,
  generateToken,
  authorizeRoles,
  optionalAuth,
};
