// backend/server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import sequelize from "./config/db.js";

// Models - Import all models
import User from "./models/User.js";
import Medicine from "./models/Medicine.js";
import Distribution from "./models/Distribution.js";
import Stock from "./models/stock.js";
import Notification from "./models/Notification.js";
import OfficerInventory from "./models/OfficerInventory.js";
import RestockRequest from "./models/RestockRequest.js";
import DailyUsage from "./models/DailyUsage.js";

// Routes
import authRoutes from "./routes/authRoutes.js";
import medicineRoutes from "./routes/medicineRoutes.js";
import distributionRoutes from "./routes/distributionRoutes.js";
import stockRoutes from "./routes/stockRoutes.js";
import officerInventoryRoutes from "./routes/officerInventoryRoutes.js";
import restockRequestRoutes from "./routes/restockRequestRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";

// Load environment variables
dotenv.config();

const app = express();

// -----------------------------
// CORS Setup
// -----------------------------
const allowedOrigins = [
  'https://purple-plant-0bd14e000.3.azurestaticapps.net', // your frontend URL
  'http://localhost:5173' // optional: local frontend for testing
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow Postman or curl
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('CORS policy: This origin is not allowed'));
    }
  },
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  credentials: true
}));

app.use(express.json());

// -----------------------------
// Define Sequelize Associations
// -----------------------------
User.hasMany(Distribution, { foreignKey: "officerId", as: "distributions" });
Medicine.hasMany(Distribution, { foreignKey: "medicineId", as: "medicineDistributions" });

Medicine.hasMany(Stock, { foreignKey: "medicineId", as: "stocks" });

User.hasMany(Notification, { foreignKey: "officerId", as: "receivedNotifications" });
User.hasMany(Notification, { foreignKey: "createdBy", as: "createdNotifications" });
Medicine.hasMany(Notification, { foreignKey: "medicineId", as: "notifications" });
Distribution.hasMany(Notification, { foreignKey: "distributionId", as: "notifications" });

User.hasMany(OfficerInventory, { foreignKey: "officerId", as: "inventories" });
Medicine.hasMany(OfficerInventory, { foreignKey: "medicineId", as: "officerInventories" });

User.hasMany(RestockRequest, { foreignKey: "officerId", as: "restockRequests" });
User.hasMany(RestockRequest, { foreignKey: "reviewedBy", as: "reviewedRequests" });
Medicine.hasMany(RestockRequest, { foreignKey: "medicineId", as: "restockRequests" });

OfficerInventory.hasMany(DailyUsage, { foreignKey: "inventoryId", as: "usageHistory" });

// -----------------------------
// Connect to MySQL and sync models
// -----------------------------
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log(" MySQL connection established via Sequelize!");
    await sequelize.sync({ alter: true });
    console.log(" All models synchronized successfully!");
  } catch (error) {
    console.error(" Database connection failed:", error.message);
    process.exit(1);
  }
};

connectDB();

// -----------------------------
// Mount routes
// -----------------------------
app.use("/api/auth", authRoutes);
app.use("/api/medicines", medicineRoutes);
app.use("/api/distributions", distributionRoutes);
app.use("/api/stock", stockRoutes);
app.use("/api/officer-inventory", officerInventoryRoutes);
app.use("/api/restock-requests", restockRequestRoutes);
app.use("/api/notifications", notificationRoutes);

// -----------------------------
// Root & test DB
// -----------------------------
app.get("/", (req, res) => res.send("🚀 Backend server running!"));
app.get("/api/test-db", async (req, res) => {
  try {
    const [result] = await sequelize.query("SELECT NOW() AS time");
    res.json({ message: " Database query successful", time: result[0].time });
  } catch (error) {
    res.status(500).json({ message: "Database error", error: error.message });
  }
});

// -----------------------------
// Global Error Handler
// -----------------------------
app.use((err, req, res, next) => {
  console.error("Global Error Handler:", err);
  res.status(500).json({ 
    message: "Internal server error", 
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// -----------------------------
// Start server
// -----------------------------
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(` Server running on port ${PORT}`));

export default app;
