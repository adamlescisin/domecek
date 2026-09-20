import { NextResponse } from 'next/server';
import { getItems, getOrders } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [items, orders] = await Promise.all([getItems(), getOrders()]);
    return NextResponse.json({
      ok: true,
      items: items.length,
      orders: orders.length,
      env: {
        DB_HOST: process.env.DB_HOST ? process.env.DB_HOST.replace(/./g, '*').slice(0, -4) + process.env.DB_HOST.slice(-4) : '(not set)',
        ADMIN_PASSWORD: !!process.env.ADMIN_PASSWORD,
        JWT_SECRET: !!process.env.JWT_SECRET,
        STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
      },
    });
  } catch (err) {
    const e = err as Error;
    return NextResponse.json(
      {
        ok: false,
        error: e.message,
        env: {
          DB_HOST: !!process.env.DB_HOST,
          DB_USER: !!process.env.DB_USER,
          DB_PASSWORD: !!process.env.DB_PASSWORD,
          DB_NAME: !!process.env.DB_NAME,
          ADMIN_PASSWORD: !!process.env.ADMIN_PASSWORD,
          JWT_SECRET: !!process.env.JWT_SECRET,
        },
      },
      { status: 503 },
    );
  }
}
