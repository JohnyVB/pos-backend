"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
const environment_config_1 = require("./environment.config");
dotenv_1.default.config();
exports.pool = new pg_1.Pool({
    host: environment_config_1.envConfig.db_host,
    database: environment_config_1.envConfig.db_name,
    user: environment_config_1.envConfig.db_user,
    password: environment_config_1.envConfig.db_password,
    ssl: {
        rejectUnauthorized: false, // This is important for Neon
    },
});
// Test the connection
exports.pool.connect((err, client, release) => {
    if (err) {
        console.error("Error connecting to PostgreSQL:", err);
    }
    else {
        console.log("Connected to PostgreSQL");
        release();
    }
});
