// backend/models/DailyUsage.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import OfficerInventory from "./OfficerInventory.js";

const DailyUsage = sequelize.define("DailyUsage", {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  usageDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  quantityUsed: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0,
    }
  },
  remainingQuantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0,
    }
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'DailyUsages',
  timestamps: true,
  indexes: [
    {
      fields: ['inventoryId', 'usageDate']
    }
  ]
});

// Relationship
DailyUsage.belongsTo(OfficerInventory, { 
  foreignKey: "inventoryId", 
  as: "inventory" 
});

export default DailyUsage;