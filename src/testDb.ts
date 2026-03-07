import { pool } from "./config/postgresql.config";

(async () => {
  const res = await pool.query("SELECT NOW()");
  console.log(res.rows);
  pool.end();
})();
