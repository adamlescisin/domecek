import { NextResponse } from 'next/server';
import { getItems, getOrders } from '@/lib/store';

export async function GET() {
  try {
    const items = getItems();
    const orders = getOrders();
    return NextResponse.json({ ok: true, items: items.length, orders: orders.length });
  } catch (err) {
    const e = err as Error;
    return NextResponse.json({ ok: false, error: e.message }, { status: 503 });
  }
}
