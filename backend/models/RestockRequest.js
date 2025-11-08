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
    type: DataTypes.ENUM('Low', 'Medium', 'High'),
    allowNull: false,
    defaultValue: 'Medium',
  },
  status: {
    type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'),
    allowNull: false,
    defaultValue: 'Pending',
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