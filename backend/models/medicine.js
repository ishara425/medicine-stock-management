// backend/models/Medicine.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Medicine = sequelize.define("Medicine", {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  srNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
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
  expirationDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  }
  // ✅ NO stock field - stock is calculated from Stock table
}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['srNumber']
    }
  ]
});

export default Medicine;