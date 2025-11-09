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
app.use(cors());
app.use(express.json());

// -----------------------------
// Define Sequelize Associations
// -----------------------------

// ✅ IMPORTANT: All belongsTo associations are already defined in model files
// We only define hasMany/hasOne reverse associations here to avoid duplicates

// Distribution reverse relationships
User.hasMany(Distribution, { foreignKey: "officerId", as: "distributions" });
Medicine.hasMany(Distribution, { foreignKey: "medicineId", as: "medicineDistributions" });

// Stock reverse relationships  
Medicine.hasMany(Stock, { foreignKey: "medicineId", as: "stocks" });

// Notification reverse relationships
User.hasMany(Notification, { foreignKey: "officerId", as: "receivedNotifications" });
User.hasMany(Notification, { foreignKey: "createdBy", as: "createdNotifications" });
Medicine.hasMany(Notification, { foreignKey: "medicineId", as: "notifications" });
Distribution.hasMany(Notification, { foreignKey: "distributionId", as: "notifications" });

// Officer Inventory reverse relationships
User.hasMany(OfficerInventory, { foreignKey: "officerId", as: "inventories" });
Medicine.hasMany(OfficerInventory, { foreignKey: "medicineId", as: "officerInventories" });

// Restock Request reverse relationships
User.hasMany(RestockRequest, { foreignKey: "officerId", as: "restockRequests" });
User.hasMany(RestockRequest, { foreignKey: "reviewedBy", as: "reviewedRequests" });
Medicine.hasMany(RestockRequest, { foreignKey: "medicineId", as: "restockRequests" });

// Daily Usage reverse relationships
OfficerInventory.hasMany(DailyUsage, { foreignKey: "inventoryId", as: "usageHistory" });

// -----------------------------
// Connect to MySQL and sync models
// -----------------------------
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ MySQL connection established via Sequelize!");

    // Sync all models (alter=true updates tables without dropping)
    await sequelize.sync({ alter: true });
    console.log("✅ All models synchronized successfully!");
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    process.exit(1); // Exit if database connection fails
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
    res.json({ message: "✅ Database query successful", time: result[0].time });
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
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

export default app;