import { drizzle, MySql2Database } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';

type DB = MySql2Database<typeof schema>;

let _db: DB | null = null;

export async function getDb(): Promise<DB> {
  if (_db) return _db;

  const connection = await mysql.createConnection({
    host:     process.env.DB_HOST,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false },
    connectTimeout: 10000,
  });

  _db = drizzle(connection, { schema, mode: 'default' }) as unknown as DB;
  return _db;
}
