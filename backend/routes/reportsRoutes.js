// backend/routes/reportsRoutes.js
import express from "express";
import {
  getOverview,
  getDistributionAnalytics,
  getStockAnalytics,
  getUsageAnalytics,
  getRestockAnalytics,
  getPredictions,
  exportReport
} from "../controllers/reportsController.js";

const router = express.Router();

// Reports & Analytics endpoints
router.get("/overview", getOverview);
router.get("/distribution-analytics", getDistributionAnalytics);
router.get("/stock-analytics", getStockAnalytics);
router.get("/usage-analytics", getUsageAnalytics);
router.get("/restock-analytics", getRestockAnalytics);
router.get("/predictions", getPredictions);
router.get("/export", exportReport);

export default router;