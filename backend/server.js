// backend/server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import sequelize from "./config/db.js";

// Models
import User from "./models/User.js";
import Medicine from "./models/Medicine.js";
import Distribution from "./models/Distribution.js";
import Stock from "./models/stock.js";

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

// 1️⃣ User → Distribution
User.hasMany(Distribution, { foreignKey: "officerId", as: "distributionsByUser" });
Distribution.belongsTo(User, { foreignKey: "officerId", as: "officerUser" });

// 2️⃣ Medicine → Distribution
Medicine.hasMany(Distribution, { foreignKey: "medicineId", as: "distributionsByMedicine" });
Distribution.belongsTo(Medicine, { foreignKey: "medicineId", as: "medicineDistributed" });

// 3️⃣ Medicine → Stock
Medicine.hasMany(Stock, { foreignKey: "medicineId", as: "stocksByMedicine" });
Stock.belongsTo(Medicine, { foreignKey: "medicineId", as: "medicineStock" });

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
// Start server
// -----------------------------
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

export default app;
