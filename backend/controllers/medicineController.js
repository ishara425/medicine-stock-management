// backend/controllers/medicineController.js
import Medicine from "../models/Medicine.js";
import Stock from "../models/stock.js";
import { Op } from "sequelize";
import sequelize from "../config/db.js";

// Get all medicines with calculated stock from Stock table
export const getAllMedicines = async (req, res) => {
  try {
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
  } catch (err) {
    console.error("Error fetching medicines:", err);
    res.status(500).json({ error: err.message });
  }
};

// Add new medicine
export const addMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.create(req.body);
    
    // Return medicine with stock = 0 (no stock entries yet)
    const medicineWithStock = await Medicine.findByPk(medicine.id, {
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
      }
    });
    
    res.status(201).json(medicineWithStock);
  } catch (err) {
    console.error("Error adding medicine:", err);
    res.status(400).json({ error: err.message });
  }
};

// Update medicine
export const updateMedicine = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await Medicine.update(req.body, { where: { id } });
    
    if (!updated) {
      return res.status(404).json({ message: "Medicine not found" });
    }
    
    const updatedMedicine = await Medicine.findByPk(id, {
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
      }
    });
    
    res.json(updatedMedicine);
  } catch (err) {
    console.error("Error updating medicine:", err);
    res.status(400).json({ error: err.message });
  }
};

// Delete medicine
export const deleteMedicine = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if there are any stock entries for this medicine
    const stockCount = await Stock.count({ where: { medicineId: id } });
    
    if (stockCount > 0) {
      return res.status(400).json({ 
        message: "Cannot delete medicine with existing stock entries. Please delete stock first." 
      });
    }
    
    const deleted = await Medicine.destroy({ where: { id } });
    
    if (!deleted) {
      return res.status(404).json({ message: "Medicine not found" });
    }
    
    res.status(204).send();
  } catch (err) {
    console.error("Error deleting medicine:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get summary (total, expiring soon, expired)
export const getSummary = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 86400000);

    const [total, expiringSoon, expired] = await Promise.all([
      Medicine.count(),
      Medicine.count({
        where: { 
          expirationDate: { 
            [Op.between]: [now, futureDate] 
          } 
        },
      }),
      Medicine.count({
        where: { 
          expirationDate: { 
            [Op.lt]: now 
          } 
        },
      })
    ]);

    res.json({ total, expiringSoon, expired });
  } catch (err) {
    console.error("Error fetching summary:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get expiring soon medicines with stock info
export const getExpiringSoon = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 86400000);
    
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
      where: { 
        expirationDate: { 
          [Op.between]: [now, futureDate] 
        } 
      },
      order: [['expirationDate', 'ASC']]
    });
    
    res.json(medicines);
  } catch (err) {
    console.error("Error fetching expiring medicines:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get expired medicines with stock info
export const getExpiredMedicines = async (req, res) => {
  try {
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
      where: { 
        expirationDate: { 
          [Op.lt]: new Date() 
        } 
      },
      order: [['expirationDate', 'DESC']]
    });
    
    res.json(medicines);
  } catch (err) {
    console.error("Error fetching expired medicines:", err);
    res.status(500).json({ error: err.message });
  }
};