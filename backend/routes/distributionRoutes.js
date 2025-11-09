// backend/routes/distributionRoutes.js
import express from "express";
import {
  getOfficers,
  getMedicines,
  distributeMedicine,
  getAllDistributions
} from "../controllers/distributionController.js";

const router = express.Router();

// Distribution routes
router.get("/officers", getOfficers);
router.get("/medicines", getMedicines);
router.get("/", getAllDistributions);
router.post("/", distributeMedicine);

export default router;