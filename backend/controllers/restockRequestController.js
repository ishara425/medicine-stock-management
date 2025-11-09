// backend/controllers/restockRequestController.js
import RestockRequest from "../models/RestockRequest.js";
import OfficerInventory from "../models/OfficerInventory.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import Medicine from "../models/Medicine.js";
import { Op } from "sequelize";
import sequelize from "../config/db.js";

// GET /api/restock-requests - Get all restock requests (with filters)
export const getAllRestockRequests = async (req, res) => {
  try {
    const { officerId, status, urgency, startDate, endDate } = req.query;
    
    const where = {};
    if (officerId) where.officerId = officerId;
    if (status) where.status = status.toUpperCase(); // ✅ Normalize to uppercase
    if (urgency) where.urgency = urgency.toUpperCase(); // ✅ Normalize to uppercase
    if (startDate || endDate) {
      where.requestDate = {};
      if (startDate) where.requestDate[Op.gte] = startDate;
      if (endDate) where.requestDate[Op.lte] = endDate;
    }

    const requests = await RestockRequest.findAll({
      where,
      include: [
        { 
          model: User, 
          as: "officer", 
          attributes: ["id", "username", "role"] 
        },
        { 
          model: User, 
          as: "reviewer", 
          attributes: ["id", "username", "role"] 
        },
        { 
          model: Medicine, 
          as: "medicine", 
          attributes: ["id", "name", "dosage", "category"] // ✅ Removed 'stock'
        },
      ],
      order: [
        ['urgency', 'DESC'], // HIGH > MEDIUM > LOW
        ['requestDate', 'DESC'] // Most recent first
      ]
    });

    console.log(`✅ Fetched ${requests.length} restock requests from database`);
    
    // Debug: Log first few requests
    if (requests.length > 0) {
      console.log('Sample request:', {
        id: requests[0].id,
        status: requests[0].status,
        urgency: requests[0].urgency,
        medicine: requests[0].medicine?.name
      });
    }
    
    res.json(requests);
  } catch (error) {
    console.error("❌ Error fetching restock requests:", error);
    res.status(500).json({ message: "Error fetching requests", error: error.message });
  }
};

// GET /api/restock-requests/officer/:officerId - Get officer's requests
export const getOfficerRestockRequests = async (req, res) => {
  try {
    const { officerId } = req.params;
    
    const requests = await RestockRequest.findAll({
      where: { officerId },
      include: [
        { 
          model: User, 
          as: "officer", 
          attributes: ["id", "username", "role"] 
        },
        { 
          model: User, 
          as: "reviewer", 
          attributes: ["id", "username", "role"] 
        },
        { 
          model: Medicine, 
          as: "medicine", 
          attributes: ["id", "name", "dosage", "category"] 
        },
      ],
      order: [['requestDate', 'DESC']]
    });

    console.log(`✅ Fetched ${requests.length} requests for officer ${officerId}`);
    
    res.json(requests);
  } catch (error) {
    console.error("❌ Error fetching officer requests:", error);
    res.status(500).json({ message: "Error fetching requests", error: error.message });
  }
};

// POST /api/restock-requests - Create new restock request
export const createRestockRequest = async (req, res) => {
  try {
    const { officerId, medicineId, requestedQuantity, reason, urgency } = req.body;

    console.log('📝 Creating restock request:', { officerId, medicineId, requestedQuantity, urgency });

    // Validate input
    if (!officerId || !medicineId || !requestedQuantity || !reason || !urgency) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (requestedQuantity <= 0) {
      return res.status(400).json({ message: "Requested quantity must be greater than 0" });
    }

    if (reason.length < 20) {
      return res.status(400).json({ message: "Reason must be at least 20 characters" });
    }

    // Normalize urgency to uppercase for consistency
    const normalizedUrgency = urgency.toUpperCase();
    if (!['LOW', 'MEDIUM', 'HIGH'].includes(normalizedUrgency)) {
      return res.status(400).json({ message: "Invalid urgency level" });
    }

    // Check if officer and medicine exist
    const officer = await User.findByPk(officerId);
    const medicine = await Medicine.findByPk(medicineId);

    if (!officer) {
      return res.status(404).json({ message: "Officer not found" });
    }

    if (!medicine) {
      return res.status(404).json({ message: "Medicine not found" });
    }

    // Get current stock from officer inventory
    const inventory = await OfficerInventory.findOne({
      where: { officerId, medicineId }
    });

    const currentStock = inventory ? inventory.currentQuantity : 0;

    // Create restock request with UPPERCASE status
    const request = await RestockRequest.create({
      officerId,
      medicineId,
      currentStock,
      requestedQuantity,
      reason,
      urgency: normalizedUrgency,
      status: 'PENDING',
      requestDate: new Date()
    });

    console.log(`✅ Restock request created with ID: ${request.id}, Status: ${request.status}, Urgency: ${request.urgency}`);

    // Create notification for admin/PHI about new restock request
    try {
      // Find all admin users to notify
      const admins = await User.findAll({
        where: { role: 'admin' }
      });

      console.log(`📬 Found ${admins.length} admin(s) to notify`);

      // Create notifications for each admin
      for (const admin of admins) {
        const notif = await Notification.create({
          officerId: admin.id, // Notify the admin
          medicineId: medicineId,
          createdBy: officerId, // Request created by the officer
          type: 'RestockRequest',
          status: 'Pending',
          title: `New Restock Request from ${officer.username}`,
          message: `${officer.username} has requested ${requestedQuantity} units of ${medicine.name}. Urgency: ${normalizedUrgency}. Reason: ${reason}`
        });
        console.log(`📧 Notification created for admin ${admin.username} (ID: ${notif.id})`);
      }
    } catch (notifError) {
      console.error("❌ Error creating notification:", notifError);
      // Don't fail the request if notification fails
    }

    // Fetch complete request with relations
    const fullRequest = await RestockRequest.findByPk(request.id, {
      include: [
        { model: User, as: "officer", attributes: ["id", "username", "role"] },
        { model: Medicine, as: "medicine", attributes: ["id", "name", "dosage", "category"] },
      ]
    });

    console.log(`✅ SUCCESS: Restock request fully created and saved to database`);

    res.status(201).json({
      message: "Restock request created successfully",
      request: fullRequest
    });
  } catch (error) {
    console.error("❌ Error creating restock request:", error);
    res.status(500).json({ message: "Error creating request", error: error.message });
  }
};

// PATCH /api/restock-requests/:id/approve - Approve restock request
export const approveRestockRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { reviewerId } = req.body;

    const request = await RestockRequest.findByPk(id, {
      include: [
        { model: User, as: "officer" },
        { model: Medicine, as: "medicine" }
      ]
    });

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({ message: "Request already processed" });
    }

    // Update request status
    request.status = 'APPROVED';
    request.reviewedBy = reviewerId;
    request.reviewedAt = new Date();
    await request.save();

    // Create notification for officer about approval
    try {
      await Notification.create({
        officerId: request.officerId,
        medicineId: request.medicineId,
        createdBy: reviewerId,
        type: 'RestockApproval',
        status: 'Pending',
        title: `Restock Request Approved`,
        message: `Your request for ${request.requestedQuantity} units of ${request.medicine.name} has been approved.`
      });
    } catch (notifError) {
      console.error("Error creating approval notification:", notifError);
    }

    console.log(`✅ Restock request approved: ID ${id}`);

    res.json({
      message: "Restock request approved successfully",
      request
    });
  } catch (error) {
    console.error("❌ Error approving request:", error);
    res.status(500).json({ message: "Error approving request", error: error.message });
  }
};

// PATCH /api/restock-requests/:id/reject - Reject restock request
export const rejectRestockRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { reviewerId, rejectionReason } = req.body;

    const request = await RestockRequest.findByPk(id, {
      include: [
        { model: User, as: "officer" },
        { model: Medicine, as: "medicine" }
      ]
    });

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({ message: "Request already processed" });
    }

    // Update request status
    request.status = 'REJECTED';
    request.reviewedBy = reviewerId;
    request.reviewedAt = new Date();
    request.rejectionReason = rejectionReason || "No reason provided";
    await request.save();

    // Create notification for officer about rejection
    try {
      await Notification.create({
        officerId: request.officerId,
        medicineId: request.medicineId,
        createdBy: reviewerId,
        type: 'RestockRejection',
        status: 'Pending',
        title: `Restock Request Rejected`,
        message: `Your request for ${request.requestedQuantity} units of ${request.medicine.name} has been rejected. Reason: ${rejectionReason || "Not specified"}`
      });
    } catch (notifError) {
      console.error("Error creating rejection notification:", notifError);
    }

    console.log(`✅ Restock request rejected: ID ${id}`);

    res.json({
      message: "Restock request rejected",
      request
    });
  } catch (error) {
    console.error("❌ Error rejecting request:", error);
    res.status(500).json({ message: "Error rejecting request", error: error.message });
  }
};

// GET /api/restock-requests/statistics - Get restock request statistics
export const getRestockStatistics = async (req, res) => {
  try {
    const { officerId } = req.query;
    
    const where = officerId ? { officerId } : {};

    const [
      totalRequests,
      pendingRequests,
      approvedRequests,
      rejectedRequests,
      highUrgency,
      mediumUrgency,
      lowUrgency
    ] = await Promise.all([
      RestockRequest.count({ where }),
      RestockRequest.count({ where: { ...where, status: 'PENDING' } }),
      RestockRequest.count({ where: { ...where, status: 'APPROVED' } }),
      RestockRequest.count({ where: { ...where, status: 'REJECTED' } }),
      RestockRequest.count({ where: { ...where, urgency: 'HIGH', status: 'PENDING' } }),
      RestockRequest.count({ where: { ...where, urgency: 'MEDIUM', status: 'PENDING' } }),
      RestockRequest.count({ where: { ...where, urgency: 'LOW', status: 'PENDING' } })
    ]);

    res.json({
      totalRequests,
      pendingRequests,
      approvedRequests,
      rejectedRequests,
      urgencyBreakdown: {
        high: highUrgency,
        medium: mediumUrgency,
        low: lowUrgency
      }
    });
  } catch (error) {
    console.error("Error fetching statistics:", error);
    res.status(500).json({ message: "Error fetching statistics", error: error.message });
  }
};