// backend/routes/stockRoutes.js
import express from "express";
import {
  getAllStock,
  receiveStock,
  getStockById,
  updateStock,
  deleteStock,
  getStockSummary,
  getExpiringStock,
} from "../controllers/stockController.js";

const router = express.Router();

router.get("/", getAllStock);
router.post("/receive", receiveStock);
router.get("/summary", getStockSummary);
router.get("/expiring", getExpiringStock);
router.get("/:id", getStockById);
router.put("/:id", updateStock);
router.delete("/:id", deleteStock);

export default router;
