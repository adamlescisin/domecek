import { NextResponse } from 'next/server';
import { getItems, getOrders } from '@/lib/store';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  const dataDir = path.join(process.cwd(), 'data');
  try {
    const items = getItems();
    const orders = getOrders();
    return NextResponse.json({
      ok: true,
      dataDir,
      items: items.length,
      orders: orders.length,
      env: {
        ADMIN_PASSWORD: !!process.env.ADMIN_PASSWORD,
        JWT_SECRET: !!process.env.JWT_SECRET,
      },
    });
  } catch (err) {
    const e = err as Error;
    return NextResponse.json({ ok: false, dataDir, error: e.message }, { status: 503 });
  }
}
