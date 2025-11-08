// backend/routes/restockRequestRoutes.js
import express from "express";
import {
  getAllRestockRequests,
  getOfficerRestockRequests,
  createRestockRequest,
  approveRestockRequest,
  rejectRestockRequest,
  getRestockStatistics
} from "../controllers/restockRequestController.js";

const router = express.Router();

// Request management
router.get("/", getAllRestockRequests);
router.get("/officer/:officerId", getOfficerRestockRequests);
router.get("/statistics", getRestockStatistics);
router.post("/", createRestockRequest);

// Request actions
router.patch("/:id/approve", approveRestockRequest);
router.patch("/:id/reject", rejectRestockRequest);

export default router;