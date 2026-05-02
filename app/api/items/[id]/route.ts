import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/client';
import { items } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { isAdminRequest } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = parseInt(params.id, 10);
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const body = await req.json();
  const updates: Record<string, unknown> = { updatedAt: new Date() };

  if (body.name !== undefined) updates.name = body.name;
  if (body.description !== undefined) updates.description = body.description;
  if (body.priceCzk !== undefined) updates.priceCzk = String(body.priceCzk);
  if (body.isActive !== undefined) updates.isActive = body.isActive ? 1 : 0;
  if (body.sortOrder !== undefined) updates.sortOrder = Number(body.sortOrder);

  const db = getDb();
  await db.update(items).set(updates).where(eq(items.id, id));
  const [updated] = await db.select().from(items).where(eq(items.id, id));

  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = parseInt(params.id, 10);
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const db = getDb();
  await db.delete(items).where(eq(items.id, id));
  return NextResponse.json({ ok: true });
}
