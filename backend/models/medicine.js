// backend/models/Medicine.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Medicine = sequelize.define("Medicine", {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,  // Keep auto-increment for internal database ID
    primaryKey: true,
  },
  srNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,  // Ensures each SR number is unique
    validate: {
      notEmpty: true,
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  dosage: DataTypes.STRING,
  manufacturer: DataTypes.STRING,
  category: DataTypes.STRING,
  stock: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  expirationDate: {
    type: DataTypes.DATEONLY,  // Use DATEONLY for date without time
    allowNull: true,
  },
  instructions: DataTypes.TEXT,
}, {
  timestamps: true,  // Adds createdAt and updatedAt
  indexes: [
    {
      unique: true,
      fields: ['srNumber']
    }
  ]
});

export default Medicine;