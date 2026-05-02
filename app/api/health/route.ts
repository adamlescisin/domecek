import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db/client';
import { items } from '@/lib/db/schema';

export async function GET() {
  try {
    const db = await getDb();
    await db.select().from(items).limit(1);
    return NextResponse.json({ ok: true, db: 'connected' });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 503 });
  }
}
