// backend/controllers/notificationController.js
import Notification from "../models/Notification.js";
import OfficerInventory from "../models/OfficerInventory.js";
import User from "../models/User.js";
import Medicine from "../models/Medicine.js";
import Distribution from "../models/Distribution.js";
import { Op } from "sequelize";

// GET /api/notifications/officer/:officerId - Get officer's notifications
// Returns ONLY Distribution notifications (not restock approval/rejection)
export const getOfficerNotifications = async (req, res) => {
  try {
    const { officerId } = req.params;
    const { status } = req.query;
    
    // Only get Distribution type notifications
    const where = { 
      officerId,
      type: 'Distribution'
    };
    
    if (status) where.status = status;

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

// NEW: GET /api/notifications/officer/:officerId/restock-updates
// Returns restock approval/rejection notifications
export const getRestockNotifications = async (req, res) => {
  try {
    const { officerId } = req.params;
    
    const notifications = await Notification.findAll({
      where: { 
        officerId,
        type: {
          [Op.in]: ['RestockApproval', 'RestockRejection']
        }
      },
      include: [
        { model: User, as: "officer", attributes: ["id", "username", "role"] },
        { model: User, as: "creator", attributes: ["id", "username", "role"] },
        { model: Medicine, as: "medicine", attributes: ["id", "name", "dosage", "category"] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(notifications);
  } catch (error) {
    console.error("Error fetching restock notifications:", error);
    res.status(500).json({ message: "Error fetching restock notifications", error: error.message });
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

    // Only Distribution type can be accepted
    if (notification.type !== 'Distribution') {
      return res.status(400).json({ 
        message: "Only distribution notifications can be accepted/rejected" 
      });
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
      inventory.totalReceived += quantity;
      inventory.currentQuantity += quantity;
      inventory.lastUpdated = new Date();
      await inventory.save();
    } else {
      inventory = await OfficerInventory.create({
        officerId: notification.officerId,
        medicineId: notification.medicineId,
        totalReceived: quantity,
        currentQuantity: quantity,
        lastUpdated: new Date()
      });
    }

    const updatedNotification = await Notification.findByPk(id, {
      include: [
        { model: User, as: "officer" },
        { model: User, as: "creator" },
        { model: Medicine, as: "medicine" },
        { model: Distribution, as: "distribution" }
      ]
    });

    return res.json({
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
      return res.status(400).json({ 
        message: "Only distribution notifications can be rejected" 
      });
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

// PATCH /api/notifications/:id/read - Mark notification as read (for restock notifications)
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findByPk(id);

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    // Only restock notifications should be marked as read
    if (notification.type === 'Distribution') {
      return res.status(400).json({ 
        message: "Distribution notifications should be accepted or rejected, not marked as read" 
      });
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
      pendingDistributions,
      unreadRestockUpdates
    ] = await Promise.all([
      Notification.count({ where: { officerId } }),
      Notification.count({ 
        where: { 
          officerId, 
          type: 'Distribution',
          status: 'Pending' 
        } 
      }),
      Notification.count({ 
        where: { 
          officerId,
          type: {
            [Op.in]: ['RestockApproval', 'RestockRejection']
          },
          status: {
            [Op.ne]: 'Read'
          }
        } 
      })
    ]);

    res.json({
      totalNotifications,
      pendingDistributions,
      unreadRestockUpdates,
      totalPending: pendingDistributions + unreadRestockUpdates
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