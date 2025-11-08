// backend/models/OfficerInventory.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import User from "./User.js";
import Medicine from "./Medicine.js";

const OfficerInventory = sequelize.define("OfficerInventory", {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  totalReceived: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  currentQuantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  lastUpdated: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'OfficerInventories',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['officerId', 'medicineId'] // One inventory record per officer-medicine pair
    }
  ]
});

// Relationships
OfficerInventory.belongsTo(User, { foreignKey: "officerId", as: "officer" });
OfficerInventory.belongsTo(Medicine, { foreignKey: "medicineId", as: "medicine" });

export default OfficerInventory;