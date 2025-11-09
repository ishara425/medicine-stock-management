import express from "express";
import {
  getAllMedicines,
  addMedicine,
  updateMedicine,
  deleteMedicine,
  getSummary,
  getExpiringSoon,
  getExpiredMedicines,
} from "../controllers/medicineController.js";

const router = express.Router();

// IMPORTANT: Define specific routes BEFORE parameterized routes
// These must come first to avoid being caught by /:id pattern
router.get("/summary", getSummary);
router.get("/expiring-soon", getExpiringSoon);
router.get("/expired", getExpiredMedicines);

// General CRUD routes
router.get("/", getAllMedicines);
router.post("/", addMedicine);
router.put("/:id", updateMedicine);
router.delete("/:id", deleteMedicine);

export default router;