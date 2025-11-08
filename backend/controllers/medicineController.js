import Medicine from "../models/Medicine.js";
import { Op } from "sequelize";
import { subDays } from "date-fns";

// Get all medicines
export const getAllMedicines = async (req, res) => {
  try {
    const medicines = await Medicine.findAll();
    res.json(medicines);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add new medicine
export const addMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.create(req.body);
    res.status(201).json(medicine);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update medicine
export const updateMedicine = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await Medicine.update(req.body, { where: { id } });
    if (!updated) return res.status(404).json({ message: "Medicine not found" });
    const updatedMedicine = await Medicine.findByPk(id);
    res.json(updatedMedicine);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete medicine
export const deleteMedicine = async (req, res) => {
  try {
    const { id } = req.params;
    await Medicine.destroy({ where: { id } });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get summary
export const getSummary = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const threshold = parseInt(req.query.threshold) || 10;

    const now = new Date();
    const expiringSoon = await Medicine.count({
      where: { expirationDate: { [Op.between]: [now, new Date(now.getTime() + days * 86400000)] } },
    });
    const expired = await Medicine.count({
      where: { expirationDate: { [Op.lt]: now } },
    });
    const lowStock = await Medicine.count({
      where: { stock: { [Op.lt]: threshold } },
    });
    const total = await Medicine.count();

    res.json({ total, expiringSoon, expired, lowStock });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Expiring soon
export const getExpiringSoon = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const now = new Date();
    const medicines = await Medicine.findAll({
      where: { expirationDate: { [Op.between]: [now, new Date(now.getTime() + days * 86400000)] } },
    });
    res.json(medicines);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Expired
export const getExpiredMedicines = async (req, res) => {
  try {
    const medicines = await Medicine.findAll({
      where: { expirationDate: { [Op.lt]: new Date() } },
    });
    res.json(medicines);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Low stock
export const getLowStock = async (req, res) => {
  try {
    const threshold = parseInt(req.query.threshold) || 10;
    const medicines = await Medicine.findAll({
      where: { stock: { [Op.lt]: threshold } },
    });
    res.json(medicines);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
