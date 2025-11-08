// backend/models/Distribution.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import User from "./User.js";
import Medicine from "./Medicine.js";

const Distribution = sequelize.define("Distribution", {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  date: {
    type: DataTypes.DATEONLY,
    defaultValue: DataTypes.NOW,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "Pending", // "Completed" | "Cancelled"
  },
});

// ✅ Define relationships (same as @ManyToOne)
Distribution.belongsTo(User, { foreignKey: "officerId", as: "officer" });
Distribution.belongsTo(Medicine, { foreignKey: "medicineId", as: "medicine" });

export default Distribution;
