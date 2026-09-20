import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { upsertOrder } from '@/lib/store';
import { sendCustomerReceipt, sendAdminNotification } from '@/lib/email';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature') ?? '';

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    const e = err as Error;
    console.error('Webhook signature error:', e.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  console.log('Webhook event received:', event.type);

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object as {
      id: string;
      status: string;
      amount: number;
      receipt_email?: string;
      metadata?: { items?: string; customer_email?: string; lang?: string };
      charges?: { data?: Array<{ billing_details?: { email?: string; name?: string } }> };
    };

    const lineItems = JSON.parse(pi.metadata?.items ?? '[]');
    const totalCzk = pi.amount / 100;
    const customerEmail = pi.receipt_email ?? pi.metadata?.customer_email ?? pi.charges?.data?.[0]?.billing_details?.email ?? '';
    const customerName = pi.charges?.data?.[0]?.billing_details?.name ?? 'Zákazník';
    const lang = pi.metadata?.lang ?? 'cs';
    const now = new Date();

    console.log('Processing order:', { paymentId: pi.id, customerEmail, totalCzk, lang, lineItems: lineItems.length });

    await upsertOrder({
      stripePaymentId: pi.id,
      stripeStatus: pi.status,
      totalCzk: String(totalCzk),
      customerEmail,
      customerName,
      lineItems,
      createdAt: now.toISOString(),
    });

    const emailData = {
      customerEmail,
      customerName,
      lineItems,
      totalCzk,
      stripePaymentId: pi.id,
      createdAt: now.toLocaleString('cs-CZ'),
      lang,
    };

    const [receiptResult, adminResult] = await Promise.allSettled([
      sendCustomerReceipt(emailData),
      sendAdminNotification(emailData),
    ]);
    if (receiptResult.status === 'rejected') console.error('sendCustomerReceipt failed:', receiptResult.reason);
    if (adminResult.status === 'rejected') console.error('sendAdminNotification failed:', adminResult.reason);
  }

  return NextResponse.json({ received: true });
}
