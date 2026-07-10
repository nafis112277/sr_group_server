const { Pool } = require("pg");
require("dotenv").config();

console.log("? Connecting to database...");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.connect((err) => {
  if (err) {
    console.error("? Database connection failed:", err.message);
  } else {
    console.log("? Neon Database connected successfully!");
  }
});

module.exports = { pool };
