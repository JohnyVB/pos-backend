import { Pool } from "pg";
import dotenv from "dotenv";
import { envConfig } from "./environment.config";

dotenv.config();

export const pool = new Pool({
  connectionString: envConfig.dataBaseIrl,
});
