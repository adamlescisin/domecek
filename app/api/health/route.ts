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
        // DB
        DB_HOST: !!process.env.DB_HOST,
        DB_USER: !!process.env.DB_USER,
        DB_PASSWORD: !!process.env.DB_PASSWORD,
        DB_NAME: !!process.env.DB_NAME,
        // Auth
        ADMIN_PASSWORD: !!process.env.ADMIN_PASSWORD,
        JWT_SECRET: !!process.env.JWT_SECRET,
        // Stripe
        STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
        STRIPE_WEBHOOK_SECRET: !!process.env.STRIPE_WEBHOOK_SECRET,
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
        // Email
        RESEND_API_KEY: !!process.env.RESEND_API_KEY,
        EMAIL_FROM: process.env.EMAIL_FROM ?? '(not set)',
        ADMIN_EMAIL: process.env.ADMIN_EMAIL ?? '(not set)',
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
          STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
          STRIPE_WEBHOOK_SECRET: !!process.env.STRIPE_WEBHOOK_SECRET,
          RESEND_API_KEY: !!process.env.RESEND_API_KEY,
          EMAIL_FROM: process.env.EMAIL_FROM ?? '(not set)',
          ADMIN_EMAIL: process.env.ADMIN_EMAIL ?? '(not set)',
        },
      },
      { status: 503 },
    );
  }
}
