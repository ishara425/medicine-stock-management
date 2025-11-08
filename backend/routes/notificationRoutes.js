// backend/routes/notificationRoutes.js
import express from "express";
import {
  getOfficerNotifications,
  acceptNotification,
  rejectNotification,
  markAsRead,
  getNotificationCounts,
  deleteNotification
} from "../controllers/notificationController.js";

const router = express.Router();

// Notification routes
router.get("/officer/:officerId", getOfficerNotifications);
router.get("/officer/:officerId/count", getNotificationCounts);

// Notification actions
router.patch("/:id/accept", acceptNotification);
router.patch("/:id/reject", rejectNotification);
router.patch("/:id/read", markAsRead);
router.delete("/:id", deleteNotification);

export default router;