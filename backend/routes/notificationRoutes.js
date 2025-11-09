// backend/routes/notificationRoutes.js
import express from "express";
import {
  getOfficerNotifications,
  getRestockNotifications,
  acceptNotification,
  rejectNotification,
  markAsRead,
  getNotificationCounts,
  deleteNotification
} from "../controllers/notificationController.js";

const router = express.Router();

// Notification routes
router.get("/officer/:officerId", getOfficerNotifications); // Only Distribution notifications
router.get("/officer/:officerId/restock-updates", getRestockNotifications); // Only Restock notifications
router.get("/officer/:officerId/count", getNotificationCounts);

// Notification actions
router.patch("/:id/accept", acceptNotification); // For Distribution only
router.patch("/:id/reject", rejectNotification); // For Distribution only
router.patch("/:id/read", markAsRead); // For Restock notifications only
router.delete("/:id", deleteNotification);

export default router;