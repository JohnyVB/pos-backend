import dotenv from "dotenv";
dotenv.config();

export const envConfig = {
  dataBaseIrl: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  PORT: process.env.PORT,
};
