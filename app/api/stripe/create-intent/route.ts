import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/client';
import { items } from '@/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { stripe } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const requested: Array<{ id: number; quantity: number }> = body.items;

  if (!Array.isArray(requested) || requested.length === 0) {
    return NextResponse.json({ error: 'No items' }, { status: 400 });
  }

  const ids = requested.map((i) => i.id);
  const db = getDb();
  const dbItems = await db.select().from(items).where(inArray(items.id, ids));

  const lineItems = requested.flatMap(({ id, quantity }) => {
    const item = dbItems.find((i) => i.id === id && i.isActive === 1);
    if (!item) return [];
    return [{ id, name: item.name, priceCzk: parseFloat(item.priceCzk), quantity }];
  });

  if (lineItems.length === 0) {
    return NextResponse.json({ error: 'No valid items' }, { status: 400 });
  }

  const totalCzk = lineItems.reduce((sum, i) => sum + i.priceCzk * i.quantity, 0);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(totalCzk * 100),
    currency: 'czk',
    automatic_payment_methods: { enabled: true },
    metadata: {
      items: JSON.stringify(lineItems),
      source: 'domecek-shop-pwa',
    },
  });

  return NextResponse.json({ clientSecret: paymentIntent.client_secret, total: totalCzk });
}
