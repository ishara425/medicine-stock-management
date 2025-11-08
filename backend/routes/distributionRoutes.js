// backend/routes/distributionRoutes.js
import express from "express";
import {
  getOfficers,
  getMedicines,
  distributeMedicine,
  getAllDistributions,
} from "../controllers/distributionController.js";

const router = express.Router();

router.get("/officers", getOfficers);
router.get("/medicines", getMedicines);
router.post("/", distributeMedicine);
router.get("/", getAllDistributions);

export default router;
