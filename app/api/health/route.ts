import { NextResponse } from 'next/server';
import { getItems, getOrders } from '@/lib/store';

export async function GET() {
  try {
    const items = getItems();
    const orders = getOrders();
    return NextResponse.json({
      ok: true,
      items: items.length,
      orders: orders.length,
      env: {
        ADMIN_PASSWORD: !!process.env.ADMIN_PASSWORD,
        JWT_SECRET: !!process.env.JWT_SECRET,
      },
    });
  } catch (err) {
    const e = err as Error;
    return NextResponse.json({ ok: false, error: e.message }, { status: 503 });
  }
}
