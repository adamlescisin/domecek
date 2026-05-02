import { drizzle, MySql2Database } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';

type DB = MySql2Database<typeof schema>;

let _db: DB | null = null;

export async function getDb(): Promise<DB> {
  if (_db) return _db;

  // Use a pool so Vercel serverless functions can reuse connections
  const pool = mysql.createPool({
    host:            process.env.DB_HOST,
    user:            process.env.DB_USER,
    password:        process.env.DB_PASSWORD,
    database:        process.env.DB_NAME,
    ssl:             { rejectUnauthorized: false },
    connectionLimit: 5,
    connectTimeout:  10000,
    waitForConnections: true,
  });

  _db = drizzle(pool, { schema, mode: 'default' }) as unknown as DB;
  return _db;
}
