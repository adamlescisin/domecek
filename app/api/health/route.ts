import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db/client';
import { items } from '@/lib/db/schema';

export async function GET() {
  const config = {
    host: process.env.DB_HOST ?? '(not set)',
    user: process.env.DB_USER ?? '(not set)',
    database: process.env.DB_NAME ?? '(not set)',
    hasPassword: !!process.env.DB_PASSWORD,
    adminPasswordSet: !!process.env.ADMIN_PASSWORD,
    jwtSecretSet: !!process.env.JWT_SECRET,
  };

  try {
    const db = await getDb();
    await db.select().from(items).limit(1);
    return NextResponse.json({ ok: true, db: 'connected', config });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err), config }, { status: 503 });
  }
}
