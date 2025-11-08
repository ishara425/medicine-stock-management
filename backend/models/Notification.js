// backend/models/Notification.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import User from "./User.js";
import Distribution from "./Distribution.js";
import Medicine from "./Medicine.js";

const Notification = sequelize.define("Notification", {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  type: {
    type: DataTypes.ENUM('Distribution', 'RestockApproval', 'RestockRejection', 'LowStock'),
    allowNull: false,
    defaultValue: 'Distribution',
  },
  status: {
    type: DataTypes.ENUM('Pending', 'Accepted', 'Rejected', 'Read'),
    allowNull: false,
    defaultValue: 'Pending',
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  readAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'Notifications',
  timestamps: true,
  indexes: [
    {
      fields: ['officerId', 'status']
    },
    {
      fields: ['type', 'status']
    }
  ]
});

// Relationships
Notification.belongsTo(User, { foreignKey: "officerId", as: "officer" });
Notification.belongsTo(User, { foreignKey: "createdBy", as: "creator" });
Notification.belongsTo(Distribution, { foreignKey: "distributionId", as: "distribution" });
Notification.belongsTo(Medicine, { foreignKey: "medicineId", as: "medicine" });

export default Notification;