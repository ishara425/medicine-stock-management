// backend/models/Stock.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import Medicine from "./Medicine.js";

const Stock = sequelize.define("Stock", {
  id: { 
    type: DataTypes.BIGINT, 
    autoIncrement: true, 
    primaryKey: true 
  },
  quantity: { 
    type: DataTypes.INTEGER, 
    allowNull: false,
    defaultValue: 0
  }, // Total received
  quantityAvailable: { 
    type: DataTypes.INTEGER, 
    allowNull: false, 
    defaultValue: 0 
  }, // Currently available (will be reduced on distribution)
  batchNumber: { 
    type: DataTypes.STRING 
  },
  expiryDate: { 
    type: DataTypes.DATEONLY 
  },
  receivedDate: { 
    type: DataTypes.DATEONLY,
    defaultValue: DataTypes.NOW
  },
  supplier: { 
    type: DataTypes.STRING 
  },
  unitPrice: { 
    type: DataTypes.DOUBLE 
  },
  reorderLevel: { 
    type: DataTypes.INTEGER 
  },
  createdAt: { 
    type: DataTypes.DATE, 
    defaultValue: DataTypes.NOW 
  },
  updatedAt: { 
    type: DataTypes.DATE, 
    defaultValue: DataTypes.NOW 
  },
}, {
  tableName: 'Stocks', // Ensure consistent table name
  timestamps: true // Enable automatic createdAt/updatedAt
});

// Relation: each stock references a medicine
Stock.belongsTo(Medicine, { foreignKey: "medicineId", as: "medicine" });

export default Stock;