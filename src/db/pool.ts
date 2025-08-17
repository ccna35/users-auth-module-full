import mysql from 'mysql2/promise';
import { env } from '../config/env';

export const pool = mysql.createPool({
  uri: env.DATABASE_URL,
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10,
  idleTimeout: 60000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});
