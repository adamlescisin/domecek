import { NextRequest, NextResponse } from 'next/server';
import { getItems, createItem } from '@/lib/store';
import { isAdminRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const admin = await isAdminRequest(req);
  const items = getItems();
  const result = admin
    ? [...items].sort((a, b) => a.sortOrder - b.sortOrder)
    : [...items].filter((i) => i.isActive === 1).sort((a, b) => a.sortOrder - b.sortOrder);
  return NextResponse.json(result);
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

  const item = createItem({
    name,
    description: description ?? null,
    priceCzk: Number(priceCzk).toFixed(2),
    isActive: isActive ? 1 : 0,
    sortOrder: Number(sortOrder),
  });

  return NextResponse.json(item, { status: 201 });
}
