// server.js
import express from "express";
import dotenv from "dotenv";
import mysql from "mysql2";
import cors from "cors";

// ✅ Load environment variables from .env file
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Create MySQL connection using environment variables
const db = mysql.createConnection({
  host: process.env.DB_HOST,        // e.g., medicalstock-db.mysql.database.azure.com
  user: process.env.DB_USER,        // e.g., admin@medicalstock-db
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  ssl: {
    rejectUnauthorized: true,       // Azure requires SSL
  },
});

// ✅ Connect to MySQL
db.connect((err) => {
  if (err) {
    console.error("❌ MySQL connection failed:", err.message);
  } else {
    console.log("✅ MySQL connected successfully!");
  }
});

// ✅ Example test route
app.get("/", (req, res) => {
  res.send("🚀 Backend server is running and connected to MySQL!");
});

// ✅ Example route to test DB
app.get("/api/test-db", (req, res) => {
  db.query("SELECT NOW() AS time", (err, result) => {
    if (err) {
      console.error("❌ Database query failed:", err.message);
      res.status(500).json({ message: "Database error", error: err.message });
    } else {
      res.json({ message: "✅ Database query successful", time: result[0].time });
    }
  });
});

// ✅ Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

export default app;
