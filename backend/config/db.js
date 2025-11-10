// backend/config/db.js
import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

// Format username for Azure MySQL
const dbUser = process.env.DB_USER.includes('@') 
  ? process.env.DB_USER 
  : `${process.env.DB_USER}@${process.env.DB_HOST.split('.')[0]}`;

const sequelize = new Sequelize(
  process.env.DB_NAME,
  dbUser,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: "mysql",
    port: process.env.DB_PORT || 3306,
    dialectOptions: {
      ssl: {
        require: true,            // Enforce SSL connection
        rejectUnauthorized: true  // Validate the server certificate
      }
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    logging: process.env.NODE_ENV === 'development' ? console.log : false
  }
);

// Test connection
sequelize.authenticate()
  .then(() => console.log('Database connected via SSL!'))
  .catch(err => console.error('DB Error:', err.message));

export default sequelize;
