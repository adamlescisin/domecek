import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/client';
import { items } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import { isAdminRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const db = await getDb();
  const admin = await isAdminRequest(req);

  const rows = admin
    ? await db.select().from(items).orderBy(asc(items.sortOrder))
    : await db.select().from(items).where(eq(items.isActive, 1)).orderBy(asc(items.sortOrder));

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { name, description, priceCzk, isActive = true, sortOrder = 0 } = body;

  if (!name || !priceCzk || Number(priceCzk) <= 0) {
    return NextResponse.json({ error: 'Chybí povinná pole' }, { status: 400 });
  }

  const db = await getDb();
  const now = new Date();
  const [result] = await db.insert(items).values({
    name,
    description: description ?? null,
    priceCzk: String(priceCzk),
    isActive: isActive ? 1 : 0,
    sortOrder: Number(sortOrder),
    createdAt: now,
    updatedAt: now,
  });

  const [created] = await db.select().from(items).where(eq(items.id, (result as any).insertId));
  return NextResponse.json(created, { status: 201 });
}
