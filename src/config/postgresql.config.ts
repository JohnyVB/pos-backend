import { Pool } from "pg";
import dotenv from "dotenv";
import { envConfig } from "./environment.config";

dotenv.config();

export const pool = new Pool({
  host: envConfig.db_host,
  database: envConfig.db_name,
  user: envConfig.db_user,
  password: envConfig.db_password,
  ssl: {
    rejectUnauthorized: false, // This is important for Neon
  },
});

// Test the connection
pool.connect((err, client, release) => {
  if (err) {
    console.error("Error connecting to PostgreSQL:", err);
  } else {
    console.log("Connected to PostgreSQL");
    release();
  }
});
