import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getDb } from '@/lib/db/client';
import { orders } from '@/lib/db/schema';
import { sendCustomerReceipt, sendAdminNotification } from '@/lib/email';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature') ?? '';

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object as any;
    const lineItems = JSON.parse(pi.metadata?.items ?? '[]');
    const totalCzk = pi.amount / 100;
    const customerEmail = pi.receipt_email ?? pi.charges?.data?.[0]?.billing_details?.email ?? '';
    const customerName = pi.charges?.data?.[0]?.billing_details?.name ?? 'Zákazník';
    const now = new Date();

    const db = await getDb();
    await db.insert(orders).values({
      stripePaymentId: pi.id,
      stripeStatus: pi.status,
      totalCzk: String(totalCzk),
      customerEmail,
      customerName,
      lineItems,
      createdAt: now,
    }).onDuplicateKeyUpdate({ set: { stripeStatus: pi.status } });

    const emailData = {
      customerEmail,
      customerName,
      lineItems,
      totalCzk,
      stripePaymentId: pi.id,
      createdAt: now.toLocaleString('cs-CZ'),
    };

    await Promise.allSettled([
      sendCustomerReceipt(emailData),
      sendAdminNotification(emailData),
    ]);
  }

  return NextResponse.json({ received: true });
}
