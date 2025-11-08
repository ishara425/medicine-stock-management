// backend/controllers/officerInventoryController.js
import OfficerInventory from "../models/OfficerInventory.js";
import DailyUsage from "../models/DailyUsage.js";
import User from "../models/User.js";
import Medicine from "../models/Medicine.js";
import { Op } from "sequelize";
import sequelize from "../config/db.js";

// GET /api/officer-inventory - Get all officer inventories (for PHI tracking)
export const getAllOfficerInventory = async (req, res) => {
  try {
    const { officerId, medicineId, lowStock } = req.query;
    
    const where = {};
    if (officerId) where.officerId = officerId;
    if (medicineId) where.medicineId = medicineId;
    
    let inventories = await OfficerInventory.findAll({
      where,
      include: [
        { 
          model: User, 
          as: "officer", 
          attributes: ["id", "username", "role"] 
        },
        { 
          model: Medicine, 
          as: "medicine", 
          attributes: ["id", "name", "dosage", "category"] 
        },
      ],
      order: [['lastUpdated', 'DESC']]
    });

    // Filter by low stock if requested
    if (lowStock === 'true') {
      inventories = inventories.filter(inv => {
        const percentage = (inv.currentQuantity / inv.totalReceived) * 100;
        return percentage < 25;
      });
    }

    res.json(inventories);
  } catch (error) {
    console.error("Error fetching officer inventory:", error);
    res.status(500).json({ message: "Error fetching inventory", error: error.message });
  }
};

// GET /api/officer-inventory/officer/:officerId - Get specific officer's inventory
export const getOfficerInventoryById = async (req, res) => {
  try {
    const { officerId } = req.params;
    
    const inventories = await OfficerInventory.findAll({
      where: { officerId },
      include: [
        { 
          model: User, 
          as: "officer", 
          attributes: ["id", "username", "role"] 
        },
        { 
          model: Medicine, 
          as: "medicine", 
          attributes: ["id", "name", "dosage", "category"] 
        },
      ],
      order: [['medicine', 'name', 'ASC']]
    });

    if (!inventories || inventories.length === 0) {
      return res.status(404).json({ message: "No inventory found for this officer" });
    }

    res.json(inventories);
  } catch (error) {
    console.error("Error fetching officer inventory:", error);
    res.status(500).json({ message: "Error fetching inventory", error: error.message });
  }
};

// GET /api/officer-inventory/:id/usage-history - Get usage history for specific inventory
export const getUsageHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { days = 30 } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    const usageHistory = await DailyUsage.findAll({
      where: {
        inventoryId: id,
        usageDate: { [Op.gte]: startDate }
      },
      order: [['usageDate', 'DESC']]
    });

    res.json(usageHistory);
  } catch (error) {
    console.error("Error fetching usage history:", error);
    res.status(500).json({ message: "Error fetching usage history", error: error.message });
  }
};

// POST /api/officer-inventory/record-usage - Record daily usage
export const recordDailyUsage = async (req, res) => {
  try {
    const { inventoryId, quantityUsed, notes } = req.body;

    // Validate input
    if (!inventoryId || !quantityUsed) {
      return res.status(400).json({ message: "inventoryId and quantityUsed are required" });
    }

    if (quantityUsed <= 0) {
      return res.status(400).json({ message: "Quantity used must be greater than 0" });
    }

    // Find inventory
    const inventory = await OfficerInventory.findByPk(inventoryId, {
      include: [
        { model: User, as: "officer" },
        { model: Medicine, as: "medicine" }
      ]
    });

    if (!inventory) {
      return res.status(404).json({ message: "Inventory not found" });
    }

    // Check if sufficient stock
    if (inventory.currentQuantity < quantityUsed) {
      return res.status(400).json({ 
        message: `Insufficient stock. Available: ${inventory.currentQuantity}, Requested: ${quantityUsed}` 
      });
    }

    // Update inventory quantity
    inventory.currentQuantity -= quantityUsed;
    inventory.lastUpdated = new Date();
    await inventory.save();

    // Create daily usage record
    const usageRecord = await DailyUsage.create({
      inventoryId,
      usageDate: new Date(),
      quantityUsed,
      remainingQuantity: inventory.currentQuantity,
      notes: notes || null
    });

    console.log(`Usage recorded: ${quantityUsed} units used. Remaining: ${inventory.currentQuantity}`);

    res.status(201).json({
      message: "Usage recorded successfully",
      usage: usageRecord,
      inventory: {
        id: inventory.id,
        medicine: inventory.medicine.name,
        currentQuantity: inventory.currentQuantity,
        totalReceived: inventory.totalReceived
      }
    });
  } catch (error) {
    console.error("Error recording usage:", error);
    res.status(500).json({ message: "Error recording usage", error: error.message });
  }
};

// GET /api/officer-inventory/statistics - Get inventory statistics
export const getInventoryStatistics = async (req, res) => {
  try {
    const { officerId } = req.query;
    
    const where = officerId ? { officerId } : {};
    
    const inventories = await OfficerInventory.findAll({
      where,
      include: [
        { model: User, as: "officer" },
        { model: Medicine, as: "medicine" }
      ]
    });

    // Calculate statistics
    const totalMedicines = inventories.length;
    const totalStock = inventories.reduce((sum, inv) => sum + inv.currentQuantity, 0);
    
    const lowStockItems = inventories.filter(inv => {
      if (inv.totalReceived === 0) return false;
      const percentage = (inv.currentQuantity / inv.totalReceived) * 100;
      return percentage < 25;
    }).length;
    
    const criticalStockItems = inventories.filter(inv => {
      if (inv.totalReceived === 0) return false;
      const percentage = (inv.currentQuantity / inv.totalReceived) * 100;
      return percentage < 10;
    }).length;

    res.json({
      totalMedicines,
      totalStock,
      lowStockItems,
      criticalStockItems,
      inventories: inventories.map(inv => ({
        id: inv.id,
        officer: inv.officer.username,
        medicine: inv.medicine.name,
        currentQuantity: inv.currentQuantity,
        totalReceived: inv.totalReceived,
        percentage: inv.totalReceived > 0 
          ? Math.round((inv.currentQuantity / inv.totalReceived) * 100) 
          : 0
      }))
    });
  } catch (error) {
    console.error("Error fetching statistics:", error);
    res.status(500).json({ message: "Error fetching statistics", error: error.message });
  }
};

// GET /api/officer-inventory/predictions/:inventoryId - Get usage predictions
export const getUsagePredictions = async (req, res) => {
  try {
    const { inventoryId } = req.params;
    
    const inventory = await OfficerInventory.findByPk(inventoryId, {
      include: [
        { model: Medicine, as: "medicine" }
      ]
    });

    if (!inventory) {
      return res.status(404).json({ message: "Inventory not found" });
    }

    // Get last 7 days of usage
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentUsage = await DailyUsage.findAll({
      where: {
        inventoryId,
        usageDate: { [Op.gte]: sevenDaysAgo }
      },
      order: [['usageDate', 'DESC']]
    });

    if (recentUsage.length === 0) {
      return res.json({
        currentQuantity: inventory.currentQuantity,
        averageDailyUsage: 0,
        daysUntilEmpty: null,
        prediction: "No usage data available"
      });
    }

    // Calculate average daily usage
    const totalUsed = recentUsage.reduce((sum, usage) => sum + usage.quantityUsed, 0);
    const avgDailyUsage = totalUsed / recentUsage.length;
    
    // Calculate days until empty
    const daysUntilEmpty = avgDailyUsage > 0 
      ? Math.floor(inventory.currentQuantity / avgDailyUsage)
      : null;

    let prediction = "Good stock levels";
    let alertLevel = "green";

    if (daysUntilEmpty !== null) {
      if (daysUntilEmpty <= 2) {
        prediction = "Critical - Restock immediately";
        alertLevel = "red";
      } else if (daysUntilEmpty <= 5) {
        prediction = "Low stock - Consider restocking soon";
        alertLevel = "yellow";
      }
    }

    res.json({
      medicine: inventory.medicine.name,
      currentQuantity: inventory.currentQuantity,
      totalReceived: inventory.totalReceived,
      averageDailyUsage: Math.round(avgDailyUsage * 100) / 100,
      daysUntilEmpty,
      prediction,
      alertLevel,
      recentUsage: recentUsage.map(u => ({
        date: u.usageDate,
        used: u.quantityUsed,
        remaining: u.remainingQuantity
      }))
    });
  } catch (error) {
    console.error("Error calculating predictions:", error);
    res.status(500).json({ message: "Error calculating predictions", error: error.message });
  }
};