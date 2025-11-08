// backend/routes/officerInventoryRoutes.js
import express from "express";
import {
  getAllOfficerInventory,
  getOfficerInventoryById,
  getUsageHistory,
  recordDailyUsage,
  getInventoryStatistics,
  getUsagePredictions
} from "../controllers/officerInventoryController.js";

const router = express.Router();

// Inventory routes
router.get("/", getAllOfficerInventory);
router.get("/officer/:officerId", getOfficerInventoryById);
router.get("/statistics", getInventoryStatistics);

// Usage routes
router.get("/:id/usage-history", getUsageHistory);
router.get("/predictions/:inventoryId", getUsagePredictions);
router.post("/record-usage", recordDailyUsage);

export default router;