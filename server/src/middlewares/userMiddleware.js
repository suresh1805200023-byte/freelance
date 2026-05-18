const jwt = require("jsonwebtoken");

const userMiddleware = (req, res, next) => {
  try {
    // Get token from cookie or Authorization header
    const authHeader = req.headers.authorization;

    let token = null;

    if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    } else if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    console.log("Received Token:", token);

    // No token
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log("Decoded JWT:", decoded);

    // Attach user data
    req.userID = decoded._id;
    req.isSeller = decoded.isSeller;
    req.isAdmin = decoded.isAdmin;

    next();
  } catch (error) {
    console.error("JWT Error:", error.message);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

module.exports = userMiddleware;