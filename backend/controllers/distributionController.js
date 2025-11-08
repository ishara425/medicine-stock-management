// backend/controllers/distributionController.js
import Distribution from "../models/Distribution.js";
import User from "../models/User.js";
import Medicine from "../models/Medicine.js";

// ✅ Get all officers (users with role "USER")
export const getOfficers = async (req, res) => {
  try {
    const officers = await User.findAll({ where: { role: "USER" } });
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

// ✅ Create new distribution
export const distributeMedicine = async (req, res) => {
  try {
    const { officerId, medicineId, quantity } = req.body;

    // Check if officer and medicine exist
    const officer = await User.findByPk(officerId);
    const medicine = await Medicine.findByPk(medicineId);

    if (!officer || !medicine) {
      return res.status(404).json({ message: "Officer or Medicine not found" });
    }

    // Create a new distribution
    const distribution = await Distribution.create({
      officerId,
      medicineId,
      quantity,
      date: new Date(),
      status: "Completed",
    });

    res.status(201).json(distribution);
  } catch (error) {
    res.status(500).json({ message: "Error distributing medicine", error: error.message });
  }
};

// ✅ Get all distribution history
export const getAllDistributions = async (req, res) => {
  try {
    const distributions = await Distribution.findAll({
      include: [
        { model: User, as: "officer", attributes: ["id", "username", "role"] },
        { model: Medicine, as: "medicine", attributes: ["id", "name", "category"] },
      ],
    });
    res.json(distributions);
  } catch (error) {
    res.status(500).json({ message: "Error fetching distributions", error: error.message });
  }
};
