import express from "express";
import {
  getAllMedicines,
  addMedicine,
  updateMedicine,
  deleteMedicine,
  getSummary,
  getExpiringSoon,
  getExpiredMedicines,
  getLowStock,
} from "../controllers/medicineController.js";

const router = express.Router();

router.get("/", getAllMedicines);
router.post("/", addMedicine);
router.put("/:id", updateMedicine);
router.delete("/:id", deleteMedicine);
router.get("/summary", getSummary);
router.get("/expiring-soon", getExpiringSoon);
router.get("/expired", getExpiredMedicines);
router.get("/low-stock", getLowStock);

export default router;
