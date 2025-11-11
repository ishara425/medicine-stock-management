// backend/controllers/authController.js
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// POST /api/auth/register 
export const registerUser = async (req, res) => {
  try {
    const { username, password, role } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({ username, password: hashedPassword, role });
    res.status(201).json({ message: "User registered", user: { id: user.id, username, role } });
  } catch (error) {
    res.status(500).json({ message: "Registration failed", error: error.message });
  }
};

// POST /api/auth/login
export const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || "your-secret-key-here", // Fallback if JWT_SECRET not in .env
      { expiresIn: "24h" } // Extended to 24 hours
    );

    // ✅ Return token, role, userId, and username
    res.json({ 
      token,
      role: user.role,           // Add role for frontend redirect
      userId: user.id,           // Add userId for future use
      username: user.username    // Add username for display
    });
  } catch (error) {
    res.status(500).json({ message: "Login failed", error: error.message });
  }
};