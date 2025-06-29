import User from "../models/user.js";
import jwt from "jsonwebtoken";

export const protectRoute = async (req, res, next) => {
  try {
    // 1. Get the Authorization header
    const authHeader = req.headers.authorization;

    // Debugging: Log the full Authorization header
    console.log("Backend: Received Authorization header:", authHeader);

    // 2. Check if the header exists and starts with 'Bearer '
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log("Backend: No Bearer token found in Authorization header.");
        return res.status(401).json({
            success: false,
            message: "Not authorized, no token provided or invalid format",
        });
    }

    // 3. Extract the token (remove "Bearer " prefix)
    const token = authHeader.split(' ')[1];

    // Debugging: Log the extracted token
    console.log("Backend: Extracted token:", token);


    // 4. Verify the token
    // Ensure process.env.JWT_SECRET is correctly loaded (e.g., using dotenv)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Debugging: Log the decoded payload
    console.log("Backend: Decoded JWT:", decoded);

    // 5. Find the user based on the decoded userId
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
        console.log("Backend: User not found for decoded userId:", decoded.userId);
      return res.status(404).json({ // Use 404 for user not found
        success: false,
        message: "User not found",
      });
    }

    // 6. Attach the user object to the request for subsequent middleware/route handlers
    req.user = user;
    next(); // Proceed to the next middleware or route
  } catch (error) {
    // Handle JWT verification errors specifically
    console.error("Backend: JWT verification or user lookup failed:", error.message);
    res.status(401).json({ // 401 Unauthorized for token issues
      success: false,
      message: `Authentication failed: ${error.message}`,
    });
  }
};