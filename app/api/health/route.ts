import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db/client';

export async function GET() {
  try {
    const pool = getPool();
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    return NextResponse.json({ ok: true, db: 'connected' });
  } catch (err) {
    const e = err as NodeJS.ErrnoException & { code?: string; sqlMessage?: string };
    return NextResponse.json(
      { ok: false, error: e.message, code: e.code, sqlMessage: e.sqlMessage },
      { status: 503 }
    );
  }
}
