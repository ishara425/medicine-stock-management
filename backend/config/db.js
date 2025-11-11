import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: "mysql",
    port: process.env.DB_PORT || 3306,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      },
      connectTimeout: 60000
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 60000,
      idle: 10000
    },
    // Only log SQL queries in development
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    retry: {
      max: 3
    }
  }
);

// Test connection on startup
sequelize.authenticate()
  .then(() => {
    console.log('Database connected successfully');
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Database host:', process.env.DB_HOST);
  })
  .catch(err => {
    console.error('Database connection failed:', err.message);
    // Log connection details (without password) for debugging
    console.error('Connection config:', {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT
    });
  });

export default sequelize;