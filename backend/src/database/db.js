import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

function requireEnv(name) {
  const value = process.env[name];
  if (value === undefined || value === null || value === '') {
    throw new Error(
      `[DB CONFIG] Missing ${name}. Set it in backend/.env (see backend/env.example.txt).`
    );
  }
  return value;
}

// Fail fast with a clear error if .env is missing / not filled.
// This prevents confusing runtime errors like: Access denied for user ''@'localhost'
const DB_HOST = requireEnv('DB_HOST');
const DB_USER = requireEnv('DB_USER');
// DB_PASS can be set via DB_PASS or DB_PASSWORD
const DB_PASS = process.env.DB_PASS || process.env.DB_PASSWORD || '';
const DB_NAME = requireEnv('DB_NAME');

if (DB_HOST.includes('tidbcloud.com') && !DB_PASS) {
  console.warn('⚠️ [DB CONFIG] DB_PASS / DB_PASSWORD is empty for TiDB Cloud! Please set DB_PASS in your environment variables.');
}

// TiDB Cloud Serverless uses port 4000 by default and requires SSL (TLSv1.2+)
const isTiDB = DB_HOST.includes('tidbcloud.com');
const DB_PORT = process.env.DB_PORT
  ? parseInt(process.env.DB_PORT, 10)
  : (isTiDB ? 4000 : 3306);

const useSSL = process.env.DB_SSL === 'true' || (isTiDB && process.env.DB_SSL !== 'false');

const pool = mysql.createPool({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASS,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  ...(useSSL ? { ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true } } : {}),
});

export default pool;
