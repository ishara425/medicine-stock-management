// backend/controllers/stockController.js
import Stock from "../models/stock.js";
import Medicine from "../models/Medicine.js";

// GET /api/stock
export const getAllStock = async (req, res) => {
  try {
    const stocks = await Stock.findAll({ include: { model: Medicine, as: "medicine" } });
    res.json(stocks);
  } catch (error) {
    res.status(500).json({ message: "Error fetching stock", error: error.message });
  }
};

// POST /api/stock/receive?medicineId=1
export const receiveStock = async (req, res) => {
  try {
    const { medicineId } = req.query;
    const medicine = await Medicine.findByPk(medicineId);
    if (!medicine) return res.status(404).json({ message: "Medicine not found" });

    const stock = await Stock.create({ ...req.body, medicineId });
    res.status(201).json(stock);
  } catch (error) {
    res.status(500).json({ message: "Error receiving stock", error: error.message });
  }
};

// GET /api/stock/:id
export const getStockById = async (req, res) => {
  try {
    const stock = await Stock.findByPk(req.params.id, { include: { model: Medicine, as: "medicine" } });
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

    if (medicineId) {
      const medicine = await Medicine.findByPk(medicineId);
      if (!medicine) return res.status(404).json({ message: "Medicine not found" });
      stock.medicineId = medicineId;
    }

    Object.assign(stock, req.body);
    await stock.save();
    res.json(stock);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/stock/:id
export const deleteStock = async (req, res) => {
  try {
    const stock = await Stock.findByPk(req.params.id);
    if (!stock) return res.status(404).json({ message: "Stock not found" });
    await stock.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Optional: stock summary (total quantity, etc.)
export const getStockSummary = async (req, res) => {
  try {
    const stocks = await Stock.findAll();
    const totalQuantity = stocks.reduce((sum, s) => sum + s.quantity, 0);
    res.json({ totalQuantity, totalItems: stocks.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Optional: expiring stock in X days
export const getExpiringStock = async (req, res) => {
  try {
    const days = parseInt(req.query.days || 30);
    const now = new Date();
    const threshold = new Date();
    threshold.setDate(now.getDate() + days);

    const stocks = await Stock.findAll({
      where: { expiryDate: { [Op.lte]: threshold } },
      include: { model: Medicine, as: "medicine" },
    });
    res.json(stocks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
