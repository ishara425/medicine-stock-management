// backend/controllers/distributionController.js
import Distribution from "../models/Distribution.js";
import User from "../models/User.js";
import Medicine from "../models/Medicine.js";
import Stock from "../models/stock.js";
import Notification from "../models/Notification.js";
import { Op } from "sequelize";

// ✅ Get all officers (users with role "OFFICER")
export const getOfficers = async (req, res) => {
  try {
    const officers = await User.findAll({ where: { role: "OFFICER" } });
    res.json(officers);
  } catch (error) {
    res.status(500).json({ message: "Error fetching officers", error: error.message });
  }
};

// ✅ Get all medicines
export const getMedicines = async (req, res) => {
  try {
    const medicines = await Medicine.findAll();
    res.json(medicines);
  } catch (error) {
    res.status(500).json({ message: "Error fetching medicines", error: error.message });
  }
};

// ✅ Create new distribution (FIXED - Properly updates Stock entries using FIFO)
export const distributeMedicine = async (req, res) => {
  try {
    const { officerId, medicineId, quantity } = req.body;

    

    // Validate input
    if (!officerId || !medicineId || !quantity) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (quantity <= 0) {
      return res.status(400).json({ message: "Quantity must be greater than 0" });
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

    // Check if enough stock is available in Medicine table
    if (medicine.stock < quantity) {
      return res.status(400).json({ 
        message: `Insufficient stock. Available: ${medicine.stock}, Requested: ${quantity}` 
      });
    }

    // Get all stock entries for this medicine with available quantity (FIFO)
    const stocks = await Stock.findAll({
      where: { 
        medicineId: medicineId,
        quantityAvailable: { [Op.gt]: 0 }
      },
      order: [['receivedDate', 'ASC']] // FIFO - First In First Out
    });

    // Calculate total available quantity in Stock table
    const totalAvailable = stocks.reduce((sum, stock) => sum + (stock.quantityAvailable || 0), 0);

    if (totalAvailable < quantity) {
      return res.status(400).json({ 
        message: `Insufficient available stock. Total available: ${totalAvailable}, Requested: ${quantity}` 
      });
    }

    // Distribute quantity across stock entries (FIFO)
    let remainingQuantity = quantity;
    
    for (const stock of stocks) {
      if (remainingQuantity <= 0) break;
      
      const deductAmount = Math.min(stock.quantityAvailable, remainingQuantity);
      stock.quantityAvailable -= deductAmount;
      await stock.save();
      
      remainingQuantity -= deductAmount;
      
      console.log(`Deducted ${deductAmount} from Stock ID ${stock.id}. Remaining available: ${stock.quantityAvailable}`);
    }

    // Reduce medicine stock
    medicine.stock -= quantity;
    await medicine.save();

    console.log(`Updated Medicine ${medicine.name}. New stock: ${medicine.stock}`);

    // Create a new distribution
    const distribution = await Distribution.create({
      officerId,
      medicineId,
      quantity,
      date: new Date(),
      status: "Completed",
    });

        // ✨ NEW: Create notification for officer
    const phiUser = await User.findByPk(req.body.phiId || 1); // Get PHI from request or default
    
    await Notification.create({
      officerId,
      medicineId,
      distributionId: distribution.id,
      createdBy: phiUser ? phiUser.id : null,
      type: 'Distribution',
      status: 'Pending',
      title: `New Medicine Distribution`,
      message: `${quantity} units of ${medicine.name} have been distributed to you by ${phiUser ? phiUser.username : 'PHI'}.`
    });

    // Fetch the complete distribution with relations
    const fullDistribution = await Distribution.findByPk(distribution.id, {
      include: [
        { model: User, as: "officer", attributes: ["id", "username", "role"] },
        { model: Medicine, as: "medicine", attributes: ["id", "name", "category", "dosage", "stock"] },
      ],
    });

    console.log(`Distribution created and notification sent to ${officer.username}`);

    res.status(201).json(fullDistribution);
  } catch (error) {
    console.error("Distribution error:", error);
    res.status(500).json({ message: "Error distributing medicine", error: error.message });
  }
};

// ✅ Get all distribution history
export const getAllDistributions = async (req, res) => {
  try {
    const distributions = await Distribution.findAll({
      include: [
        { model: User, as: "officer", attributes: ["id", "username", "role"] },
        { model: Medicine, as: "medicine", attributes: ["id", "name", "category", "dosage", "stock"] },
      ],
      order: [['date', 'DESC']], // Most recent first
    });
    res.json(distributions);
  } catch (error) {
    res.status(500).json({ message: "Error fetching distributions", error: error.message });
  }
};