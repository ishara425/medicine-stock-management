// backend/controllers/notificationController.js
import Notification from "../models/Notification.js";
import OfficerInventory from "../models/OfficerInventory.js";
import User from "../models/User.js";
import Medicine from "../models/Medicine.js";
import Distribution from "../models/Distribution.js";
import { Op } from "sequelize";

// GET /api/notifications/officer/:officerId - Get officer's notifications
export const getOfficerNotifications = async (req, res) => {
  try {
    const { officerId } = req.params;
    const { status, type } = req.query;
    
    const where = { officerId };
    if (status) where.status = status;
    if (type) where.type = type;

    const notifications = await Notification.findAll({
      where,
      include: [
        { model: User, as: "officer", attributes: ["id", "username", "role"] },
        { model: User, as: "creator", attributes: ["id", "username", "role"] },
        { model: Medicine, as: "medicine", attributes: ["id", "name", "dosage", "category"] },
        { model: Distribution, as: "distribution" }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Error fetching notifications", error: error.message });
  }
};

// PATCH /api/notifications/:id/accept - Accept distribution notification
export const acceptNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findByPk(id, {
      include: [
        { model: Medicine, as: "medicine" },
        { model: Distribution, as: "distribution" }
      ]
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    if (notification.status !== 'Pending') {
      return res.status(400).json({ message: "Notification already processed" });
    }

    if (notification.type !== 'Distribution') {
      return res.status(400).json({ message: "Only distribution notifications can be accepted" });
    }

    // Update notification status
    notification.status = 'Accepted';
    notification.readAt = new Date();
    await notification.save();

    // Update distribution status
    if (notification.distribution) {
      notification.distribution.status = 'Completed';
      await notification.distribution.save();
    }

    // Update officer inventory
    const quantity = notification.distribution ? notification.distribution.quantity : 0;
    
let inventory = await OfficerInventory.findOne({
      where: {
        officerId: notification.officerId,
        medicineId: notification.medicineId
      }
    });

    if (inventory) {
      // Update existing inventory
      inventory.totalReceived += quantity;
      inventory.currentQuantity += quantity;
      inventory.lastUpdated = new Date();
      await inventory.save();
      console.log(`Updated inventory: ${inventory.medicine?.name} - Added ${quantity} units`);
    } else {
      // Create new inventory record
      inventory = await OfficerInventory.create({
        officerId: notification.officerId,
        medicineId: notification.medicineId,
        totalReceived: quantity,
        currentQuantity: quantity,
        lastUpdated: new Date()
      });
      console.log(`Created new inventory: Medicine ID ${notification.medicineId} - ${quantity} units`);
    }

    const updatedNotification = await Notification.findByPk(id, {
      include: [
        { model: User, as: "officer" },
        { model: User, as: "creator" },
        { model: Medicine, as: "medicine" },
        { model: Distribution, as: "distribution" }
      ]
    });

    res.json({
      message: "Distribution accepted successfully",
      notification: updatedNotification,
      inventory
    });
  } catch (error) {
    console.error("Error accepting notification:", error);
    res.status(500).json({ message: "Error accepting notification", error: error.message });
  }
};

// PATCH /api/notifications/:id/reject - Reject distribution notification
export const rejectNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findByPk(id, {
      include: [
        { model: Medicine, as: "medicine" },
        { model: Distribution, as: "distribution" }
      ]
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    if (notification.status !== 'Pending') {
      return res.status(400).json({ message: "Notification already processed" });
    }

    if (notification.type !== 'Distribution') {
      return res.status(400).json({ message: "Only distribution notifications can be rejected" });
    }

    // Update notification status
    notification.status = 'Rejected';
    notification.readAt = new Date();
    await notification.save();

    // Update distribution status
    if (notification.distribution) {
      notification.distribution.status = 'Cancelled';
      await notification.distribution.save();
    }

    const updatedNotification = await Notification.findByPk(id, {
      include: [
        { model: User, as: "officer" },
        { model: User, as: "creator" },
        { model: Medicine, as: "medicine" },
        { model: Distribution, as: "distribution" }
      ]
    });

    res.json({
      message: "Distribution rejected",
      notification: updatedNotification
    });
  } catch (error) {
    console.error("Error rejecting notification:", error);
    res.status(500).json({ message: "Error rejecting notification", error: error.message });
  }
};

// PATCH /api/notifications/:id/read - Mark notification as read
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findByPk(id);

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    notification.status = 'Read';
    notification.readAt = new Date();
    await notification.save();

    res.json({
      message: "Notification marked as read",
      notification
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ message: "Error updating notification", error: error.message });
  }
};

// GET /api/notifications/officer/:officerId/count - Get notification counts
export const getNotificationCounts = async (req, res) => {
  try {
    const { officerId } = req.params;

    const [
      totalNotifications,
      pendingNotifications,
      acceptedNotifications,
      rejectedNotifications,
      unreadNotifications
    ] = await Promise.all([
      Notification.count({ where: { officerId } }),
      Notification.count({ where: { officerId, status: 'Pending' } }),
      Notification.count({ where: { officerId, status: 'Accepted' } }),
      Notification.count({ where: { officerId, status: 'Rejected' } }),
      Notification.count({ where: { officerId, readAt: null } })
    ]);

    res.json({
      totalNotifications,
      pendingNotifications,
      acceptedNotifications,
      rejectedNotifications,
      unreadNotifications
    });
  } catch (error) {
    console.error("Error fetching notification counts:", error);
    res.status(500).json({ message: "Error fetching counts", error: error.message });
  }
};

// DELETE /api/notifications/:id - Delete notification
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findByPk(id);

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    await notification.destroy();

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ message: "Error deleting notification", error: error.message });
  }
};