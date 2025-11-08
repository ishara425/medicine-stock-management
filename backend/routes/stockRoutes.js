// backend/routes/stockRoutes.js
import express from "express";
import {
  getAllStock,
  getConsolidatedStock,      // NEW - Add this import
  getMedicineBatches,         // NEW - Add this import
  receiveStock,
  getStockById,
  updateStock,
  deleteStock,
  getStockSummary,
  getExpiringStock,
} from "../controllers/stockController.js";

const router = express.Router();

// ⚠️ IMPORTANT: Order matters! Specific routes MUST come before parameterized routes (:id)
router.get("/consolidated", getConsolidatedStock);        // NEW - Must be before /:id
router.get("/summary", getStockSummary);
router.get("/expiring", getExpiringStock);
router.get("/medicine/:medicineId/batches", getMedicineBatches);  // NEW - For batch details
router.get("/:id", getStockById);                        // Keep this after specific routes
router.get("/", getAllStock);

router.post("/receive", receiveStock);
router.put("/:id", updateStock);
router.delete("/:id", deleteStock);

export default router;