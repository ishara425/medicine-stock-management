// backend/controllers/stockController.js
import Stock from "../models/stock.js";
import Medicine from "../models/Medicine.js";
import { Op } from "sequelize";
import sequelize from "../config/db.js";

// GET /api/stock
export const getAllStock = async (req, res) => {
  try {
    const stocks = await Stock.findAll({ 
      include: { model: Medicine, as: "medicine" },
      order: [['receivedDate', 'DESC']]
    });
    res.json(stocks);
  } catch (error) {
    console.error("Error in getAllStock:", error);
    res.status(500).json({ message: "Error fetching stock", error: error.message });
  }
};

// GET /api/stock/consolidated - Get consolidated stock view (one row per medicine)
export const getConsolidatedStock = async (req, res) => {
  try {
    const consolidatedStock = await Stock.findAll({
      attributes: [
        'medicineId',
        [sequelize.fn('SUM', sequelize.col('quantity')), 'totalQuantity'],
        [sequelize.fn('SUM', sequelize.col('quantityAvailable')), 'totalAvailable'],
        [sequelize.fn('MAX', sequelize.col('Stock.updatedAt')), 'lastUpdated'],
        [sequelize.fn('MIN', sequelize.col('receivedDate')), 'firstReceived'],
      ],
      include: [{ 
        model: Medicine, 
        as: "medicine",
        attributes: ['id', 'name', 'dosage', 'category', 'srNumber']
      }],
      group: ['medicineId', 'medicine.id'],
      order: [[sequelize.fn('MAX', sequelize.col('Stock.updatedAt')), 'DESC']],
      raw: false
    });

    // Format the response
    const formattedStock = consolidatedStock.map((item, index) => ({
      id: item.medicineId,
      srNumber: item.medicine?.srNumber || `MED${String(index + 1).padStart(3, '0')}`,
      medicine: item.medicine,
      medicineName: item.medicine?.name,
      quantity: parseInt(item.getDataValue('totalQuantity')) || 0, // Total stock
      quantityAvailable: parseInt(item.getDataValue('totalAvailable')) || 0, // Available stock
      lastUpdated: item.getDataValue('lastUpdated'),
      firstReceived: item.getDataValue('firstReceived')
    }));

    res.json(formattedStock);
  } catch (error) {
    console.error("Error fetching consolidated stock:", error);
    res.status(500).json({ message: "Error fetching consolidated stock", error: error.message });
  }
};

// GET /api/stock/medicine/:medicineId/batches
export const getMedicineBatches = async (req, res) => {
  try {
    const { medicineId } = req.params;
    
    if (!medicineId || isNaN(medicineId)) {
      return res.status(400).json({ message: "Invalid medicine ID" });
    }
    
    const batches = await Stock.findAll({
      where: { medicineId: parseInt(medicineId) },
      include: { model: Medicine, as: "medicine" },
      order: [['receivedDate', 'DESC']]
    });
    
    res.json(batches);
  } catch (error) {
    console.error("Error fetching medicine batches:", error);
    res.status(500).json({ message: "Error fetching medicine batches", error: error.message });
  }
};

// POST /api/stock/receive?medicineId=1
export const receiveStock = async (req, res) => {
  try {
    const { medicineId } = req.query;
    const { quantity, batchNumber, receivedDate, expiryDate, supplier, unitPrice } = req.body;

    // Validate required fields
    if (!medicineId || !quantity) {
      return res.status(400).json({ message: "medicineId and quantity are required" });
    }

    if (isNaN(quantity) || quantity <= 0) {
      return res.status(400).json({ message: "Quantity must be a positive number" });
    }

    const medicine = await Medicine.findByPk(medicineId);
    if (!medicine) {
      return res.status(404).json({ message: "Medicine not found" });
    }

    // Create stock entry - quantity and quantityAvailable are the same initially
    const stock = await Stock.create({ 
      medicineId: parseInt(medicineId),
      quantity: parseInt(quantity),
      quantityAvailable: parseInt(quantity), // All received stock is available initially
      batchNumber: batchNumber || `BATCH-${Date.now()}`,
      receivedDate: receivedDate || new Date(),
      expiryDate: expiryDate || null,
      supplier: supplier || null,
      unitPrice: unitPrice || null
    });

    console.log(`✅ Stock received: Medicine ID ${medicineId}, Quantity: ${stock.quantity}, Available: ${stock.quantityAvailable}`);

    // Return stock with medicine details
    const stockWithMedicine = await Stock.findByPk(stock.id, {
      include: { model: Medicine, as: "medicine" }
    });

    res.status(201).json(stockWithMedicine);
  } catch (error) {
    console.error("Error receiving stock:", error);
    res.status(500).json({ message: "Error receiving stock", error: error.message });
  }
};

// GET /api/stock/summary
export const getStockSummary = async (req, res) => {
  try {
    // Count unique medicines that have stock
    const uniqueMedicinesResult = await Stock.findAll({
      attributes: [[sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('medicineId'))), 'count']],
      raw: true
    });
    const totalMedicines = parseInt(uniqueMedicinesResult[0]?.count) || 0;
    
    // Get grouped stock data for low stock calculation
    const stocks = await Stock.findAll({
      attributes: [
        'medicineId',
        [sequelize.fn('SUM', sequelize.col('quantity')), 'totalQuantity'],
        [sequelize.fn('SUM', sequelize.col('quantityAvailable')), 'totalAvailable'],
      ],
      group: ['medicineId'],
      raw: true
    });
    
    // Calculate low stock items (less than 20% available)
    const lowStockItems = stocks.filter(stock => {
      const total = parseInt(stock.totalQuantity) || 0;
      const available = parseInt(stock.totalAvailable) || 0;
      if (total === 0) return false;
      const percentage = (available / total) * 100;
      return percentage < 20 && available > 0;
    }).length;

    // Count recent stock updates (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const stockUpdates = await Stock.count({
      where: { updatedAt: { [Op.gte]: weekAgo } }
    });

    res.json({ 
      totalMedicines, 
      lowStockItems, 
      stockUpdates 
    });
  } catch (error) {
    console.error("Error in stock summary:", error);
    res.status(500).json({ message: "Error fetching stock summary", error: error.message });
  }
};

// GET /api/stock/:id
export const getStockById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({ message: "Invalid stock ID" });
    }
    
    const stock = await Stock.findByPk(id, { 
      include: { model: Medicine, as: "medicine" } 
    });
    
    if (!stock) {
      return res.status(404).json({ message: "Stock not found" });
    }
    
    res.json(stock);
  } catch (error) {
    console.error("Error in getStockById:", error);
    res.status(500).json({ message: "Error fetching stock", error: error.message });
  }
};

// PUT /api/stock/:id
export const updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { medicineId } = req.query;
    
    const stock = await Stock.findByPk(id);
    if (!stock) {
      return res.status(404).json({ message: "Stock not found" });
    }

    if (medicineId) {
      const medicine = await Medicine.findByPk(medicineId);
      if (!medicine) {
        return res.status(404).json({ message: "Medicine not found" });
      }
      stock.medicineId = medicineId;
    }

    // Update stock fields
    Object.assign(stock, req.body);
    await stock.save();

    console.log(`✅ Stock updated: ID ${id}, Available: ${stock.quantityAvailable}`);
    
    const updatedStock = await Stock.findByPk(stock.id, {
      include: { model: Medicine, as: "medicine" }
    });
    
    res.json(updatedStock);
  } catch (error) {
    console.error("Error in updateStock:", error);
    res.status(500).json({ message: "Error updating stock", error: error.message });
  }
};

// DELETE /api/stock/:id
export const deleteStock = async (req, res) => {
  try {
    const { id } = req.params;
    
    const stock = await Stock.findByPk(id);
    if (!stock) {
      return res.status(404).json({ message: "Stock not found" });
    }
    
    console.log(`✅ Stock deleted: ID ${id}, Medicine ID: ${stock.medicineId}`);
    
    await stock.destroy();
    
    res.status(204).send();
  } catch (error) {
    console.error("Error in deleteStock:", error);
    res.status(500).json({ message: "Error deleting stock", error: error.message });
  }
};

// GET /api/stock/expiring
export const getExpiringStock = async (req, res) => {
  try {
    const days = parseInt(req.query.days || 30);
    const now = new Date();
    const threshold = new Date();
    threshold.setDate(now.getDate() + days);

    const stocks = await Stock.findAll({
      where: { 
        expiryDate: { [Op.lte]: threshold },
        quantityAvailable: { [Op.gt]: 0 }
      },
      include: { model: Medicine, as: "medicine" },
      order: [['expiryDate', 'ASC']]
    });
    
    res.json(stocks);
  } catch (error) {
    console.error("Error in getExpiringStock:", error);
    res.status(500).json({ message: "Error fetching expiring stock", error: error.message });
  }
};