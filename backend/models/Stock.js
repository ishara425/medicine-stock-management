// backend/models/Stock.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import Medicine from "./Medicine.js";

const Stock = sequelize.define("Stock", {
  id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
  quantity: { type: DataTypes.INTEGER, allowNull: false },
  batchNumber: { type: DataTypes.STRING },
  expiryDate: { type: DataTypes.DATEONLY },
  receivedDate: { type: DataTypes.DATEONLY },
  supplier: { type: DataTypes.STRING },
  unitPrice: { type: DataTypes.DOUBLE },
  reorderLevel: { type: DataTypes.INTEGER },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
});

// Relation: each stock references a medicine
Stock.belongsTo(Medicine, { foreignKey: "medicineId", as: "medicine" });

export default Stock;
