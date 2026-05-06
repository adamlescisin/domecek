import { drizzle, MySql2Database } from 'drizzle-orm/mysql2';
import mysql, { Pool } from 'mysql2/promise';
import * as schema from './schema';

type DB = MySql2Database<typeof schema>;

let _pool: Pool | null = null;
let _db: DB | null = null;

export function getPool(): Pool {
  if (_pool) return _pool;

  _pool = mysql.createPool({
    host:            process.env.DB_HOST,
    user:            process.env.DB_USER,
    password:        process.env.DB_PASSWORD,
    database:        process.env.DB_NAME,
    ssl:             { rejectUnauthorized: false },
    connectTimeout:  10000,
    waitForConnections: true,
    connectionLimit: 5,
    enableKeepAlive: true,
  });

  return _pool;
}

export function getDb(): DB {
  if (_db) return _db;
  _db = drizzle(getPool(), { schema, mode: 'default' }) as unknown as DB;
  return _db;
}
