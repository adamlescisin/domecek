import { NextRequest, NextResponse } from 'next/server';
import { updateItem, deleteItem } from '@/lib/store';
import { isAdminRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = parseInt(params.id, 10);
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  try {
    const body = await req.json();
    const updates: Record<string, unknown> = {};

    if (body.name !== undefined) updates.name = body.name;
    if (body.description !== undefined) updates.description = body.description;
    if (body.priceCzk !== undefined) updates.priceCzk = Number(body.priceCzk).toFixed(2);
    if (body.isActive !== undefined) updates.isActive = body.isActive ? 1 : 0;
    if (body.sortOrder !== undefined) updates.sortOrder = Number(body.sortOrder);

    const updated = updateItem(id, updates);
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (err) {
    const e = err as Error;
    console.error('PUT /api/items error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 503 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = parseInt(params.id, 10);
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  try {
    const deleted = deleteItem(id);
    if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const e = err as Error;
    console.error('DELETE /api/items error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 503 });
  }
}
