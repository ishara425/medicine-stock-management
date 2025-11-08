import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Medicine = sequelize.define("Medicine", {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  dosage: DataTypes.STRING,
  manufacturer: DataTypes.STRING,
  category: DataTypes.STRING,
  stock: DataTypes.INTEGER,
  expirationDate: DataTypes.DATE,
  instructions: DataTypes.STRING,
});

export default Medicine;
