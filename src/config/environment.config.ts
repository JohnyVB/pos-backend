import dotenv from "dotenv";
dotenv.config();

export const envConfig = {
  db_host: process.env.DB_HOST,
  db_user: process.env.DB_USER,
  db_password: process.env.DB_PASSWORD,
  db_name: process.env.DB_NAME,
  jwt_secret: process.env.JWT_SECRET,
  port: process.env.PORT,
};
