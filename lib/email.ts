import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY!);

interface LineItem {
  id: number;
  name: string;
  priceCzk: number;
  quantity: number;
}

interface OrderEmailData {
  customerEmail: string;
  customerName: string;
  lineItems: LineItem[];
  totalCzk: number;
  stripePaymentId: string;
  createdAt: string;
  lang?: string;
}

interface EmailStrings {
  subject: string;
  greeting: (name: string) => string;
  paymentSuccess: string;
  colItem: string;
  colQty: string;
  colPrice: string;
  colTotal: string;
  totalLabel: string;
  closing: string;
}

const EMAIL_STRINGS: Record<string, EmailStrings> = {
  cs: {
    subject: 'Děkujeme za vaši objednávku — Domeček u Josefa',
    greeting: (name) => `Děkujeme, ${name}!`,
    paymentSuccess: 'Vaše platba proběhla úspěšně.',
    colItem: 'Položka',
    colQty: 'Počet',
    colPrice: 'Cena/ks',
    colTotal: 'Celkem',
    totalLabel: 'Celkem:',
    closing: 'Těšíme se na vás v Domečku u Josefa!',
  },
  en: {
    subject: 'Thank you for your order — Domeček u Josefa',
    greeting: (name) => `Thank you, ${name}!`,
    paymentSuccess: 'Your payment was successful.',
    colItem: 'Item',
    colQty: 'Qty',
    colPrice: 'Price',
    colTotal: 'Total',
    totalLabel: 'Total:',
    closing: 'We look forward to welcoming you at Domeček u Josefa!',
  },
  de: {
    subject: 'Vielen Dank für Ihre Bestellung — Domeček u Josefa',
    greeting: (name) => `Vielen Dank, ${name}!`,
    paymentSuccess: 'Ihre Zahlung war erfolgreich.',
    colItem: 'Artikel',
    colQty: 'Menge',
    colPrice: 'Preis/Stk.',
    colTotal: 'Gesamt',
    totalLabel: 'Gesamt:',
    closing: 'Wir freuen uns auf Ihren Besuch im Domeček u Josefa!',
  },
  sk: {
    subject: 'Ďakujeme za vašu objednávku — Domeček u Josefa',
    greeting: (name) => `Ďakujeme, ${name}!`,
    paymentSuccess: 'Vaša platba prebehla úspešne.',
    colItem: 'Položka',
    colQty: 'Počet',
    colPrice: 'Cena/ks',
    colTotal: 'Spolu',
    totalLabel: 'Spolu:',
    closing: 'Tešíme sa na vás v Domečku u Josefa!',
  },
};

function getStrings(lang?: string): EmailStrings {
  return EMAIL_STRINGS[lang ?? 'cs'] ?? EMAIL_STRINGS.cs;
}

function formatCZK(amount: number) {
  return new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', minimumFractionDigits: 0 }).format(amount);
}

function itemRows(items: LineItem[]) {
  return items
    .map(
      (i) => `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #E0D8CE">${i.name}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #E0D8CE;text-align:center">${i.quantity}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #E0D8CE;text-align:right">${formatCZK(i.priceCzk)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #E0D8CE;text-align:right">${formatCZK(i.priceCzk * i.quantity)}</td>
      </tr>`
    )
    .join('');
}

export async function sendCustomerReceipt(data: OrderEmailData) {
  const { customerEmail, customerName, lineItems, totalCzk, lang } = data;
  const s = getStrings(lang);
  await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to: customerEmail,
    subject: s.subject,
    html: `
<!DOCTYPE html>
<html lang="${lang ?? 'cs'}">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F7F3EE;font-family:'DM Sans',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F3EE;padding:40px 0">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#FDFAF6;border-radius:12px;overflow:hidden">
        <tr><td style="background:#1C1C1A;padding:24px 40px;text-align:center">
          <img src="https://www.domecekujosefa.cz/wp-content/uploads/2021/10/DUJ_logo_black_2.png" alt="Domeček u Josefa" height="48" style="filter:invert(1)">
        </td></tr>
        <tr><td style="padding:40px">
          <h1 style="font-family:Georgia,serif;color:#1C1C1A;margin:0 0 8px">${s.greeting(customerName)}</h1>
          <p style="color:#5C4033;margin:0 0 32px">${s.paymentSuccess}</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E0D8CE;border-radius:8px;overflow:hidden">
            <thead><tr style="background:#F7F3EE">
              <th style="padding:8px 12px;text-align:left;font-size:12px;color:#5C4033;text-transform:uppercase">${s.colItem}</th>
              <th style="padding:8px 12px;text-align:center;font-size:12px;color:#5C4033;text-transform:uppercase">${s.colQty}</th>
              <th style="padding:8px 12px;text-align:right;font-size:12px;color:#5C4033;text-transform:uppercase">${s.colPrice}</th>
              <th style="padding:8px 12px;text-align:right;font-size:12px;color:#5C4033;text-transform:uppercase">${s.colTotal}</th>
            </tr></thead>
            <tbody>${itemRows(lineItems)}</tbody>
            <tfoot><tr style="background:#F7F3EE">
              <td colspan="3" style="padding:12px;font-weight:bold;text-align:right">${s.totalLabel}</td>
              <td style="padding:12px;font-weight:bold;text-align:right;color:#1C1C1A">${formatCZK(totalCzk)}</td>
            </tr></tfoot>
          </table>
          <p style="color:#1C1C1A;margin:32px 0 8px">${s.closing}</p>
          <p style="color:#5C4033;margin:0">domecekujosefa@gmail.com · +420 773 454 854</p>
          <p style="color:#7B8C6E;font-size:13px;margin:24px 0 0">Hostín 7, 277 32 Hostín</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
}

export async function sendAdminNotification(data: OrderEmailData) {
  const { customerEmail, customerName, lineItems, totalCzk, stripePaymentId, createdAt, lang } = data;
  await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to: process.env.ADMIN_EMAIL!,
    subject: `💰 Nová platba — ${formatCZK(totalCzk)}`,
    html: `
<!DOCTYPE html>
<html lang="cs">
<head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;padding:24px;background:#F7F3EE">
  <h2 style="color:#1C1C1A">Nová objednávka přijata</h2>
  <p><strong>Zákazník:</strong> ${customerName} (${customerEmail})</p>
  <p><strong>Jazyk objednávky:</strong> ${lang ?? 'cs'}</p>
  <p><strong>Datum:</strong> ${createdAt}</p>
  <table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%">
    <thead><tr><th>Položka</th><th>Počet</th><th>Celkem</th></tr></thead>
    <tbody>
      ${lineItems.map((i) => `<tr><td>${i.name}</td><td>${i.quantity}</td><td>${formatCZK(i.priceCzk * i.quantity)}</td></tr>`).join('')}
    </tbody>
  </table>
  <p><strong>Celkem: ${formatCZK(totalCzk)}</strong></p>
  <p><strong>Stripe ID:</strong> ${stripePaymentId}</p>
  <p><a href="https://dashboard.stripe.com/payments/${stripePaymentId}">Zobrazit v Stripe Dashboard</a></p>
</body>
</html>`,
  });
}
