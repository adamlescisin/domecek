import { Resend } from 'resend';

function getResend() {
  return new Resend(process.env.RESEND_API_KEY!);
}

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
  const { customerEmail, customerName, lineItems, totalCzk } = data;
  await getResend().emails.send({
    from: process.env.EMAIL_FROM!,
    to: customerEmail,
    subject: 'Děkujeme za vaši objednávku — Domeček u Josefa',
    html: `
<!DOCTYPE html>
<html lang="cs">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F7F3EE;font-family:'DM Sans',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F3EE;padding:40px 0">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#FDFAF6;border-radius:12px;overflow:hidden">
        <tr><td style="background:#1C1C1A;padding:24px 40px;text-align:center">
          <img src="https://www.domecekujosefa.cz/wp-content/uploads/2021/10/DUJ_logo_black_2.png" alt="Domeček u Josefa" height="48" style="filter:invert(1)">
        </td></tr>
        <tr><td style="padding:40px">
          <h1 style="font-family:Georgia,serif;color:#1C1C1A;margin:0 0 8px">Děkujeme, ${customerName}!</h1>
          <p style="color:#5C4033;margin:0 0 32px">Vaše platba proběhla úspěšně.</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E0D8CE;border-radius:8px;overflow:hidden">
            <thead><tr style="background:#F7F3EE">
              <th style="padding:8px 12px;text-align:left;font-size:12px;color:#5C4033;text-transform:uppercase">Položka</th>
              <th style="padding:8px 12px;text-align:center;font-size:12px;color:#5C4033;text-transform:uppercase">Počet</th>
              <th style="padding:8px 12px;text-align:right;font-size:12px;color:#5C4033;text-transform:uppercase">Cena/ks</th>
              <th style="padding:8px 12px;text-align:right;font-size:12px;color:#5C4033;text-transform:uppercase">Celkem</th>
            </tr></thead>
            <tbody>${itemRows(lineItems)}</tbody>
            <tfoot><tr style="background:#F7F3EE">
              <td colspan="3" style="padding:12px;font-weight:bold;text-align:right">Celkem:</td>
              <td style="padding:12px;font-weight:bold;text-align:right;color:#1C1C1A">${formatCZK(totalCzk)}</td>
            </tr></tfoot>
          </table>
          <p style="color:#1C1C1A;margin:32px 0 8px">Těšíme se na vás v Domečku u Josefa!</p>
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
  const { customerEmail, customerName, lineItems, totalCzk, stripePaymentId, createdAt } = data;
  await getResend().emails.send({
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
