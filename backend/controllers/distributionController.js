// backend/controllers/distributionController.js
import Distribution from "../models/Distribution.js";
import User from "../models/User.js";
import Medicine from "../models/Medicine.js";
import Stock from "../models/stock.js";
import Notification from "../models/Notification.js";
import { Op } from "sequelize";
import sequelize from "../config/db.js";

// ✅ Get all officers (users with role "OFFICER")
export const getOfficers = async (req, res) => {
  try {
    const officers = await User.findAll({ where: { role: "OFFICER" } });
    res.json(officers);
  } catch (error) {
    res.status(500).json({ message: "Error fetching officers", error: error.message });
  }
};

// ✅ Get all medicines with calculated stock from Stock table
export const getMedicines = async (req, res) => {
  try {
    // Get all medicines with their total stock from Stock table
    const medicines = await Medicine.findAll({
      attributes: {
        include: [
          [
            sequelize.literal(`(
              SELECT COALESCE(SUM(quantityAvailable), 0)
              FROM Stocks
              WHERE Stocks.medicineId = Medicine.id
            )`),
            'stock'
          ]
        ]
      },
      order: [['name', 'ASC']]
    });
    
    res.json(medicines);
  } catch (error) {
    console.error("Error fetching medicines:", error);
    res.status(500).json({ message: "Error fetching medicines", error: error.message });
  }
};

// ✅ Create new distribution (Uses Stock table for inventory management)
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

    // ✅ Get total available stock from Stock table
    const totalStockResult = await Stock.findAll({
      attributes: [[sequelize.fn('SUM', sequelize.col('quantityAvailable')), 'totalAvailable']],
      where: { 
        medicineId: medicineId,
        quantityAvailable: { [Op.gt]: 0 }
      },
      raw: true
    });

    const totalAvailable = parseInt(totalStockResult[0]?.totalAvailable) || 0;

    if (totalAvailable < quantity) {
      return res.status(400).json({ 
        message: `Insufficient stock. Available: ${totalAvailable}, Requested: ${quantity}` 
      });
    }

    // ✅ Get all stock entries for this medicine (FIFO - First In First Out)
    const stocks = await Stock.findAll({
      where: { 
        medicineId: medicineId,
        quantityAvailable: { [Op.gt]: 0 }
      },
      order: [['receivedDate', 'ASC']] // FIFO ordering
    });

    // ✅ Distribute quantity across stock entries (FIFO)
    let remainingQuantity = quantity;
    
    for (const stock of stocks) {
      if (remainingQuantity <= 0) break;
      
      const deductAmount = Math.min(stock.quantityAvailable, remainingQuantity);
      stock.quantityAvailable -= deductAmount;
      await stock.save();
      
      remainingQuantity -= deductAmount;
      
      console.log(`✅ Deducted ${deductAmount} from Stock ID ${stock.id}. Remaining available: ${stock.quantityAvailable}`);
    }

    // ✅ Create a new distribution
    const distribution = await Distribution.create({
      officerId,
      medicineId,
      quantity,
      date: new Date(),
      status: "Completed",
    });

    // ✅ Create notification for officer
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

    // ✅ Fetch the complete distribution with relations
    const fullDistribution = await Distribution.findByPk(distribution.id, {
      include: [
        { model: User, as: "officer", attributes: ["id", "username", "role"] },
        { 
          model: Medicine, 
          as: "medicine", 
          attributes: {
            include: [
              ['id', 'id'],
              ['name', 'name'],
              ['category', 'category'],
              ['dosage', 'dosage'],
              [
                sequelize.literal(`(
                  SELECT COALESCE(SUM(quantityAvailable), 0)
                  FROM Stocks
                  WHERE Stocks.medicineId = medicine.id
                )`),
                'stock'
              ]
            ]
          }
        },
      ],
    });

    console.log(`✅ Distribution created: ${quantity} units of ${medicine.name} to ${officer.username}`);

    res.status(201).json(fullDistribution);
  } catch (error) {
    console.error("❌ Distribution error:", error);
    res.status(500).json({ message: "Error distributing medicine", error: error.message });
  }
};

// ✅ Get all distribution history
export const getAllDistributions = async (req, res) => {
  try {
    const distributions = await Distribution.findAll({
      include: [
        { model: User, as: "officer", attributes: ["id", "username", "role"] },
        { 
          model: Medicine, 
          as: "medicine", 
          attributes: {
            include: [
              ['id', 'id'],
              ['name', 'name'],
              ['category', 'category'],
              ['dosage', 'dosage'],
              [
                sequelize.literal(`(
                  SELECT COALESCE(SUM(quantityAvailable), 0)
                  FROM Stocks
                  WHERE Stocks.medicineId = medicine.id
                )`),
                'stock'
              ]
            ]
          }
        },
      ],
      order: [['date', 'DESC']], // Most recent first
    });
    res.json(distributions);
  } catch (error) {
    console.error("Error fetching distributions:", error);
    res.status(500).json({ message: "Error fetching distributions", error: error.message });
  }
};