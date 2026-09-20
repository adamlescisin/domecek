import { NextRequest, NextResponse } from 'next/server';
import { getItems, getTranslationsForLang } from '@/lib/store';
import { stripe } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const requested: Array<{ id: number; quantity: number }> = body.items;
  const email: string | undefined = body.email;
  const lang: string = body.lang ?? 'cs';

  if (!Array.isArray(requested) || requested.length === 0) {
    return NextResponse.json({ error: 'No items' }, { status: 400 });
  }

  const [allItems, translations] = await Promise.all([
    getItems(),
    lang !== 'cs' ? getTranslationsForLang(lang) : Promise.resolve([]),
  ]);

  const translatedNames: Record<number, string> = {};
  for (const t of translations) {
    if (t.entityType === 'item' && t.field === 'name') translatedNames[t.entityId] = t.value;
  }

  const lineItems = requested.flatMap(({ id, quantity }) => {
    const item = allItems.find((i) => i.id === id && i.isActive === 1);
    if (!item) return [];
    return [{ id, name: translatedNames[item.id] ?? item.name, priceCzk: parseFloat(item.priceCzk), quantity }];
  });

  if (lineItems.length === 0) {
    return NextResponse.json({ error: 'No valid items' }, { status: 400 });
  }

  const totalCzk = lineItems.reduce((sum, i) => sum + i.priceCzk * i.quantity, 0);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(totalCzk * 100),
    currency: 'czk',
    automatic_payment_methods: { enabled: true },
    ...(email ? { receipt_email: email } : {}),
    metadata: {
      items: JSON.stringify(lineItems),
      lang,
      source: 'domecek-shop-pwa',
      ...(email ? { customer_email: email } : {}),
    },
  });

  return NextResponse.json({ clientSecret: paymentIntent.client_secret, total: totalCzk });
}
