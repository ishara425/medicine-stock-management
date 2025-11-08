// backend/controllers/stockController.js
import Stock from "../models/stock.js";
import Medicine from "../models/Medicine.js";
import { Op } from "sequelize";
import sequelize from "../config/db.js";  // ✨ ADD THIS IMPORT

// GET /api/stock
export const getAllStock = async (req, res) => {
  try {
    const stocks = await Stock.findAll({ 
      include: { model: Medicine, as: "medicine" },
      order: [['receivedDate', 'DESC']]
    });
    res.json(stocks);
  } catch (error) {
    res.status(500).json({ message: "Error fetching stock", error: error.message });
  }
};

// ✨ NEW: GET /api/stock/consolidated - Get consolidated stock view (one row per medicine)
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
        attributes: ['id', 'name', 'dosage', 'category', 'stock']
      }],
      group: ['medicineId', 'medicine.id'],
      order: [[sequelize.fn('MAX', sequelize.col('Stock.updatedAt')), 'DESC']]
    });

    // Format the response
    const formattedStock = consolidatedStock.map((item, index) => ({
      id: item.medicineId,
      srNumber: `MED${String(index + 1).padStart(3, '0')}`,
      medicine: item.medicine,
      medicineName: item.medicine?.name,
      quantity: parseInt(item.dataValues.totalQuantity) || 0,
      quantityAvailable: parseInt(item.dataValues.totalAvailable) || 0,
      lastUpdated: item.dataValues.lastUpdated,
      firstReceived: item.dataValues.firstReceived
    }));

    res.json(formattedStock);
  } catch (error) {
    console.error("Error fetching consolidated stock:", error);
    res.status(500).json({ message: "Error fetching consolidated stock", error: error.message });
  }
};

// ✨ NEW: GET /api/stock/medicine/:medicineId/batches - Get all batches for a specific medicine
export const getMedicineBatches = async (req, res) => {
  try {
    const { medicineId } = req.params;
    
    const batches = await Stock.findAll({
      where: { medicineId: parseInt(medicineId) },
      include: { model: Medicine, as: "medicine" },
      order: [['receivedDate', 'DESC']]
    });
    
    res.json(batches);
  } catch (error) {
    console.error("Error fetching medicine batches:", error);
    res.status(500).json({ message: error.message });
  }
};

// POST /api/stock/receive?medicineId=1
export const receiveStock = async (req, res) => {
  try {
    const { medicineId } = req.query;
    const { quantity, batchNumber, receivedDate, expiryDate } = req.body;

    // Validate required fields
    if (!medicineId || !quantity) {
      return res.status(400).json({ message: "medicineId and quantity are required" });
    }

    const medicine = await Medicine.findByPk(medicineId);
    if (!medicine) {
      return res.status(404).json({ message: "Medicine not found" });
    }

    // Create stock entry with quantityAvailable equal to quantity initially
    const stock = await Stock.create({ 
      medicineId: parseInt(medicineId),
      quantity: parseInt(quantity),
      quantityAvailable: parseInt(quantity), // Initially, all received stock is available
      batchNumber: batchNumber || `BATCH-${Date.now()}`, // Auto-generate if not provided
      receivedDate: receivedDate || new Date(),
      expiryDate: expiryDate || null
    });

    console.log(`Stock created: ID ${stock.id}, Quantity: ${stock.quantity}, Available: ${stock.quantityAvailable}`);

    // Update medicine total stock
    medicine.stock = (medicine.stock || 0) + parseInt(quantity);
    await medicine.save();

    console.log(`Medicine ${medicine.name} stock updated to: ${medicine.stock}`);

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
    // Count unique medicines using SQL aggregation for better performance
    const uniqueMedicines = await Stock.findAll({
      attributes: [[sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('medicineId'))), 'count']],
      raw: true
    });
    const totalMedicines = parseInt(uniqueMedicines[0]?.count) || 0;
    
    // Get all stocks for low stock calculation (grouped by medicine)
    const stocks = await Stock.findAll({
      attributes: [
        'medicineId',
        [sequelize.fn('SUM', sequelize.col('quantity')), 'totalQuantity'],
        [sequelize.fn('SUM', sequelize.col('quantityAvailable')), 'totalAvailable'],
      ],
      group: ['medicineId']
    });
    
    const lowStockItems = stocks.filter(stock => {
      const total = parseInt(stock.dataValues.totalQuantity) || 0;
      const available = parseInt(stock.dataValues.totalAvailable) || 0;
      if (total === 0) return false;
      const percentage = (available / total) * 100;
      return percentage < 20 && available > 0;
    }).length;

    // Count recent updates (last 7 days)
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
    res.status(500).json({ message: error.message });
  }
};

// GET /api/stock/:id
export const getStockById = async (req, res) => {
  try {
    const stock = await Stock.findByPk(req.params.id, { 
      include: { model: Medicine, as: "medicine" } 
    });
    if (!stock) return res.status(404).json({ message: "Stock not found" });
    res.json(stock);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/stock/:id?medicineId=1
export const updateStock = async (req, res) => {
  try {
    const { medicineId } = req.query;
    const stock = await Stock.findByPk(req.params.id);
    if (!stock) return res.status(404).json({ message: "Stock not found" });

    const oldAvailable = stock.quantityAvailable;

    if (medicineId) {
      const medicine = await Medicine.findByPk(medicineId);
      if (!medicine) return res.status(404).json({ message: "Medicine not found" });
      stock.medicineId = medicineId;
    }

    // Update stock fields
    Object.assign(stock, req.body);
    await stock.save();

    // If quantity changed, update Medicine total stock
    if (req.body.quantityAvailable !== undefined) {
      const medicine = await Medicine.findByPk(stock.medicineId);
      if (medicine) {
        // Recalculate total stock from all stock entries
        const allStocks = await Stock.findAll({
          where: { medicineId: stock.medicineId }
        });
        const totalStock = allStocks.reduce((sum, s) => sum + (s.quantityAvailable || 0), 0);
        medicine.stock = totalStock;
        await medicine.save();
        console.log(`Medicine ${medicine.name} total stock recalculated to: ${totalStock}`);
      }
    }
    
    const updatedStock = await Stock.findByPk(stock.id, {
      include: { model: Medicine, as: "medicine" }
    });
    
    res.json(updatedStock);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/stock/:id
export const deleteStock = async (req, res) => {
  try {
    const stock = await Stock.findByPk(req.params.id);
    if (!stock) return res.status(404).json({ message: "Stock not found" });
    
    const medicineId = stock.medicineId;
    const quantityToDeduct = stock.quantityAvailable || 0;
    
    await stock.destroy();
    
    // Update medicine total stock after deletion
    const medicine = await Medicine.findByPk(medicineId);
    if (medicine) {
      medicine.stock = Math.max(0, (medicine.stock || 0) - quantityToDeduct);
      await medicine.save();
      console.log(`Medicine ${medicine.name} stock updated after deletion to: ${medicine.stock}`);
    }
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message });
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
    res.status(500).json({ message: error.message });
  }
};