// backend/models/RestockRequest.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import User from "./User.js";
import Medicine from "./Medicine.js";

const RestockRequest = sequelize.define("RestockRequest", {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  currentStock: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  requestedQuantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
    }
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [20, 1000] // Min 20 characters, max 1000
    }
  },
  urgency: {
    type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH'), // Changed to UPPERCASE
    allowNull: false,
    defaultValue: 'MEDIUM', // Changed to UPPERCASE
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED'), // Changed to UPPERCASE
    allowNull: false,
    defaultValue: 'PENDING', // Changed to UPPERCASE
  },
  requestDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  reviewedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  rejectionReason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'RestockRequests',
  timestamps: true,
  indexes: [
    {
      fields: ['officerId', 'status']
    },
    {
      fields: ['status', 'urgency']
    }
  ]
});

// Relationships
RestockRequest.belongsTo(User, { foreignKey: "officerId", as: "officer" });
RestockRequest.belongsTo(User, { foreignKey: "reviewedBy", as: "reviewer" });
RestockRequest.belongsTo(Medicine, { foreignKey: "medicineId", as: "medicine" });

export default RestockRequest;