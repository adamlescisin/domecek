# Domeček u Josefa — Shop PWA
## Claude Code Build Specification

**Version:** 1.0  
**Prepared for:** Claude Code  
**Stack:** Next.js 14 · TypeScript · MySQL (Hostinger) · Stripe · Vercel  
**Brand:** [domecekujosefa.cz](https://domecekujosefa.cz) — rustic Czech countryside hospitality

---

## 0. Project Overview

Build a **Progressive Web App (PWA)** for Domeček u Josefa — a family-run rural accommodation in Bohemia. The app serves two audiences:

| Audience | Path | Purpose |
|---|---|---|
| **Admin (owner)** | `/admin` | Manage a product/service catalogue with prices and availability |
| **Client (guest)** | `/` | Browse available items, add to basket, pay via Apple Pay / Google Pay |

The app must feel like a natural extension of domecekujosefa.cz: warm, natural, honest craftsmanship aesthetic. Black, white, warm cream, natural wood tones.

---

## 1. Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | **Next.js 14** (App Router) | API routes + SSR + PWA-friendly |
| Language | **TypeScript** | Type safety throughout |
| Styling | **Tailwind CSS** + custom CSS vars | Utility-first + brand tokens |
| Database | **MySQL** on Hostinger | Client's existing hosting |
| ORM | **Drizzle ORM** | Lightweight, SQL-first, works on edge |
| Payments | **Stripe** (Payment Intents + Payment Request Button) | Apple Pay + Google Pay support; already used by the site |
| Email | **Resend** (or **Nodemailer** with Gmail SMTP fallback) | Transactional emails |
| PWA | **next-pwa** | Service worker, manifest, offline shell |
| Auth | **Custom JWT** with `jose` library | Simple password-based admin, no OAuth overhead |
| Deployment | **Vercel** | Native Next.js hosting |

---

## 2. Brand & Design System

### 2.1 Colour Palette

```css
:root {
  --color-cream:       #F7F3EE;   /* page background */
  --color-warm-white:  #FDFAF6;   /* card surfaces */
  --color-charcoal:    #1C1C1A;   /* primary text, logo */
  --color-brown:       #5C4033;   /* accent, headings */
  --color-sage:        #7B8C6E;   /* secondary accent, success states */
  --color-sand:        #C9A96E;   /* CTA hover, badge */
  --color-border:      #E0D8CE;   /* dividers, input borders */
  --color-error:       #B94040;   /* error states */
}
```

### 2.2 Typography

```css
/* Import in layout.tsx */
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=DM+Sans:wght@300;400;500&display=swap');

--font-display: 'Cormorant Garamond', serif;   /* headings, prices, brand moments */
--font-body:    'DM Sans', sans-serif;          /* UI, labels, buttons */
```

### 2.3 Logo Usage

Fetch from: `https://www.domecekujosefa.cz/wp-content/uploads/2021/10/DUJ_logo_black_2.png`

Store as `public/logo-black.png` and `public/logo-white.png` (download both from the site during setup).

### 2.4 Spacing Scale

Use Tailwind defaults. Key tokens: `gap-4` (16px base), `rounded-xl` for cards, `shadow-sm` (soft depth).

### 2.5 Iconography

Use **Lucide React** icons throughout. No other icon library.

---

## 3. Project Structure

```
domecek-shop/
├── app/
│   ├── layout.tsx                 # Root layout, PWA manifest link, fonts
│   ├── page.tsx                   # Client shop page (/)
│   ├── admin/
│   │   ├── page.tsx               # Redirect to /admin/login if not authed
│   │   ├── login/
│   │   │   └── page.tsx           # Password login form
│   │   └── dashboard/
│   │       └── page.tsx           # Item management dashboard
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts     # POST: validate password, return JWT cookie
│   │   │   └── logout/route.ts    # POST: clear JWT cookie
│   │   ├── items/
│   │   │   ├── route.ts           # GET: list items; POST: create item
│   │   │   └── [id]/route.ts      # PUT: update item; DELETE: delete item
│   │   ├── stripe/
│   │   │   ├── create-intent/route.ts   # POST: create PaymentIntent
│   │   │   └── webhook/route.ts         # POST: handle Stripe webhooks
│   │   └── health/route.ts        # GET: DB connectivity check
├── components/
│   ├── shop/
│   │   ├── ItemCard.tsx           # Single item display card
│   │   ├── BasketDrawer.tsx       # Slide-in basket panel
│   │   ├── CheckoutForm.tsx       # Stripe Payment Element wrapper
│   │   └── SuccessScreen.tsx      # Post-payment confirmation
│   ├── admin/
│   │   ├── ItemTable.tsx          # Sortable table of all items
│   │   ├── ItemModal.tsx          # Create/Edit modal dialog
│   │   └── ToggleSwitch.tsx       # Active/inactive toggle
│   └── ui/
│       ├── Logo.tsx
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Badge.tsx
│       └── LoadingSpinner.tsx
├── lib/
│   ├── db/
│   │   ├── client.ts              # Drizzle MySQL client (mysql2)
│   │   ├── schema.ts              # Table definitions
│   │   └── migrations/            # SQL migration files
│   ├── auth.ts                    # JWT sign/verify helpers
│   ├── stripe.ts                  # Stripe client singleton
│   ├── email.ts                   # Email sending helpers
│   └── utils.ts                   # formatCZK, cn(), etc.
├── middleware.ts                   # Protect /admin/* routes via JWT
├── public/
│   ├── logo-black.png
│   ├── logo-white.png
│   ├── icon-192.png               # PWA icon
│   ├── icon-512.png               # PWA icon
│   ├── manifest.json
│   └── sw.js                      # (generated by next-pwa)
├── .env.local                     # Secrets (see Section 8)
├── next.config.ts
├── tailwind.config.ts
├── drizzle.config.ts
└── package.json
```

---

## 4. Database Schema

### 4.1 Migration: `001_initial.sql`

```sql
CREATE TABLE items (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(200) NOT NULL,
  description TEXT,
  price_czk   DECIMAL(10, 2) NOT NULL,
  is_active   TINYINT(1) NOT NULL DEFAULT 1,
  sort_order  INT UNSIGNED NOT NULL DEFAULT 0,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE orders (
  id                 INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  stripe_payment_id  VARCHAR(100) NOT NULL UNIQUE,
  stripe_status      VARCHAR(50) NOT NULL,
  total_czk          DECIMAL(10, 2) NOT NULL,
  customer_email     VARCHAR(255),
  customer_name      VARCHAR(255),
  line_items         JSON NOT NULL,       -- snapshot of items at time of purchase
  created_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_items_active ON items(is_active, sort_order);
CREATE INDEX idx_orders_stripe ON orders(stripe_payment_id);
```

### 4.2 Drizzle Schema: `lib/db/schema.ts`

```typescript
import { mysqlTable, int, varchar, text, decimal, tinyint, json, datetime } from 'drizzle-orm/mysql-core';

export const items = mysqlTable('items', {
  id:          int('id').autoincrement().primaryKey(),
  name:        varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  priceCzk:    decimal('price_czk', { precision: 10, scale: 2 }).notNull(),
  isActive:    tinyint('is_active').notNull().default(1),
  sortOrder:   int('sort_order').notNull().default(0),
  createdAt:   datetime('created_at').notNull(),
  updatedAt:   datetime('updated_at').notNull(),
});

export const orders = mysqlTable('orders', {
  id:              int('id').autoincrement().primaryKey(),
  stripePaymentId: varchar('stripe_payment_id', { length: 100 }).notNull().unique(),
  stripeStatus:    varchar('stripe_status', { length: 50 }).notNull(),
  totalCzk:        decimal('total_czk', { precision: 10, scale: 2 }).notNull(),
  customerEmail:   varchar('customer_email', { length: 255 }),
  customerName:    varchar('customer_name', { length: 255 }),
  lineItems:       json('line_items').notNull(),
  createdAt:       datetime('created_at').notNull(),
});
```

---

## 5. API Routes

### 5.1 Authentication

**`POST /api/auth/login`**
```typescript
// Body: { password: string }
// Validates against ADMIN_PASSWORD env var (bcrypt hash comparison)
// On success: sets httpOnly cookie `duj_admin_token` (JWT, 24h expiry)
// Returns: { ok: true } or 401
```

**`POST /api/auth/logout`**
```typescript
// Clears the duj_admin_token cookie
// Returns: { ok: true }
```

### 5.2 Items

**`GET /api/items`**
```typescript
// Public: returns only active items ordered by sort_order
// Admin (with valid JWT): returns ALL items including inactive
// Query param: ?admin=true (checked against cookie)
```

**`POST /api/items`** *(requires admin JWT)*
```typescript
// Body: { name: string, description?: string, priceCzk: number, isActive: boolean, sortOrder?: number }
// Validates: name required, priceCzk > 0
// Returns: created item with id
```

**`PUT /api/items/[id]`** *(requires admin JWT)*
```typescript
// Body: partial item fields (any combination)
// Returns: updated item
```

**`DELETE /api/items/[id]`** *(requires admin JWT)*
```typescript
// Hard delete (items are typically few in number)
// Returns: { ok: true }
```

### 5.3 Stripe

**`POST /api/stripe/create-intent`**
```typescript
// Body: { items: Array<{ id: number, quantity: number }> }
// Server re-fetches prices from DB (never trust client prices)
// Creates Stripe PaymentIntent in CZK
// Returns: { clientSecret: string, total: number }
```

**`POST /api/stripe/webhook`**
```typescript
// Verifies Stripe webhook signature
// On payment_intent.succeeded:
//   1. Upsert order into DB
//   2. Send customer receipt email
//   3. Send admin notification email
// Returns: { received: true }
```

---

## 6. Page Implementations

### 6.1 Client Shop Page (`/`)

**Layout:**
```
┌─────────────────────────────────────┐
│  [Logo]          Domeček u Josefa   │ ← sticky header, cream bg
│                        [🛒 Košík 2] │
├─────────────────────────────────────┤
│  Vyberte si služby                  │ ← display heading, Cormorant
│  Přidejte položky do košíku a       │
│  plaťte kartou, Apple Pay nebo      │
│  Google Pay.                        │
├─────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐         │
│  │ Item     │  │ Item     │         │ ← 2-col grid (mobile: 1-col)
│  │          │  │          │
│  │ 1 000 Kč │  │ 1 000 Kč │
│  │ [+ Přidat│  │ [+ Přidat│
│  └──────────┘  └──────────┘
└─────────────────────────────────────┘
```

**Item Card design:**
- Cream card, subtle warm shadow, `rounded-xl`
- Item name in Cormorant Garamond (18px, weight 600)
- Description in DM Sans (14px, muted)
- Price: large Cormorant Garamond (24px), "Kč" in smaller DM Sans
- "Přidat do košíku" button — full width, charcoal bg, cream text, hover: brown bg
- If item already in basket: show quantity stepper (−  2  +) instead of button

**Basket Drawer:**
- Slides in from right (CSS transform transition)
- Backdrop overlay (click outside to close)
- Lists items with name, qty, subtotal
- Running total at bottom
- "Zaplatit [total] Kč" CTA button → opens checkout modal
- Empty state: illustration + "Košík je prázdný"

**Checkout Modal:**
- Full-screen on mobile, centered dialog on desktop
- Stripe `PaymentElement` (handles Apple Pay / Google Pay automatically)
- Show order summary above payment form
- Loading skeleton while PaymentIntent is being created
- On success: dismiss modal, show `SuccessScreen` overlay

**SuccessScreen:**
- Full-page overlay, animated ✓ checkmark (CSS stroke animation)
- "Děkujeme! Platba proběhla úspěšně." heading
- "Potvrzení posíláme na váš email." subtext
- "Zpět na výběr" button

### 6.2 Admin Login Page (`/admin/login`)

- Centred single-column layout on cream background
- Logo at top
- "Přihlášení správce" heading
- Single password input (type="password"), "Přihlásit" button
- On wrong password: inline error "Nesprávné heslo"
- On success: redirect to `/admin/dashboard`

### 6.3 Admin Dashboard (`/admin/dashboard`)

**Header:**
- Logo left, "Správa položek" title, "Odhlásit" button right

**Stats bar (3 cards):**
- Total active items
- Total items
- (placeholder for future: revenue today)

**Items Table:**
```
┌──────────────────────────────────────────────────────────┐
│  Název          │  Cena     │ Aktivní │  Akce            │
├──────────────────────────────────────────────────────────┤
│  Snídaně v košíku │ 200 Kč  │  ●  ON  │  [✏️] [🗑️]     │
│  Koupací sud    │ 1 000 Kč  │  ○  OFF │  [✏️] [🗑️]     │
└──────────────────────────────────────────────────────────┘
```

- Toggle switch component: smooth CSS pill toggle, green=active, grey=inactive
- Clicking toggle immediately updates DB via PUT (optimistic UI)
- Edit button: opens `ItemModal` pre-filled with item data
- Delete button: confirmation popover ("Opravdu smazat?") before DELETE call

**"Přidat položku" button** (top right, charcoal fill):
- Opens empty `ItemModal`

**ItemModal fields:**
- Název (text, required)
- Popis (textarea, optional)
- Cena v Kč (number input, min 1, required)
- Aktivní (toggle switch)
- Pořadí (number, optional, for sort_order)
- Save / Cancel buttons

---

## 7. PWA Configuration

### 7.1 `public/manifest.json`

```json
{
  "name": "Domeček u Josefa — Obchod",
  "short_name": "DuJ Shop",
  "description": "Objednejte si služby Domečku u Josefa",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#F7F3EE",
  "theme_color": "#1C1C1A",
  "orientation": "portrait",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
```

### 7.2 `next.config.ts`

```typescript
import withPWA from 'next-pwa';

const nextConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com/,
      handler: 'CacheFirst',
      options: { cacheName: 'google-fonts', expiration: { maxEntries: 4, maxAgeSeconds: 365 * 24 * 60 * 60 } }
    },
    {
      urlPattern: /\/api\/items/,
      handler: 'NetworkFirst',
      options: { cacheName: 'api-items', expiration: { maxAgeSeconds: 60 } }
    }
  ]
})({});

export default nextConfig;
```

### 7.3 PWA Icons

Generate from the DUJ black logo. Create square 512×512 and 192×192 PNG icons with a cream (#F7F3EE) background and the black logo centred. Store in `public/`.

---

## 8. Environment Variables

```bash
# .env.local

# Database (Hostinger MySQL)
DATABASE_URL="mysql://username:password@hostname:3306/database_name"
# Note: use connection pooling via ?connectionLimit=5 or PlanetScale-style proxy if needed

# Admin Auth
ADMIN_PASSWORD_HASH="$2b$10$..."     # bcrypt hash of the admin password
JWT_SECRET="your-256-bit-random-secret"

# Stripe
STRIPE_SECRET_KEY="sk_live_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Email (Resend — recommended, or use SMTP)
RESEND_API_KEY="re_..."
EMAIL_FROM="obchod@domecekujosefa.cz"
ADMIN_EMAIL="domecekujosefa@gmail.com"

# App
NEXT_PUBLIC_APP_URL="https://shop.domecekujosefa.cz"   # or custom domain on Vercel
```

---

## 9. Email Templates

Both emails are **HTML emails** sent on `payment_intent.succeeded`. Write them in Czech.

### 9.1 Customer Receipt

**Subject:** `Děkujeme za vaši objednávku — Domeček u Josefa`

**Content:**
- DUJ logo header (black on cream)
- "Děkujeme, [jméno]!" heading
- Order summary table: item name, qty, price per unit, line total
- **Total line in bold**
- "Těšíme se na vás v Domečku u Josefa!"
- Contact: domecekujosefa@gmail.com | +420 773 454 854
- Footer: Hostín 7, 277 32 Hostín

### 9.2 Admin Notification

**Subject:** `💰 Nová platba — [total] Kč`

**Content:**
- "Nová objednávka přijata" heading
- Customer name + email
- Date/time
- Item list with quantities
- Total
- Stripe payment ID (for reference)
- Link to Stripe dashboard

---

## 10. Middleware & Security

### `middleware.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Protect all /admin/* routes except /admin/login
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const token = request.cookies.get('duj_admin_token')?.value;
    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    try {
      await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET));
    } catch {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
```

### Security Checklist
- [ ] Stripe webhook signature verified via `stripe.webhooks.constructEvent`
- [ ] All admin API routes check JWT in cookie (not just middleware)
- [ ] Item prices always re-fetched server-side before creating PaymentIntent
- [ ] SQL injection impossible via Drizzle ORM parameterised queries
- [ ] CORS: Next.js API routes locked to same origin
- [ ] Rate limiting on `/api/auth/login`: max 5 attempts per IP per 15 min (use `upstash/ratelimit` or simple in-memory map)
- [ ] `httpOnly`, `secure`, `sameSite: 'strict'` on auth cookie

---

## 11. Stripe Integration Details

### Currency

All amounts in **CZK**. Stripe stores amounts in **haléře (hellers)** — multiply Kč by 100.

```typescript
// lib/stripe.ts
import Stripe from 'stripe';
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
  typescript: true,
});
```

### PaymentIntent creation

```typescript
const paymentIntent = await stripe.paymentIntents.create({
  amount: Math.round(totalCzk * 100),   // hellers
  currency: 'czk',
  automatic_payment_methods: { enabled: true },  // enables Apple Pay, Google Pay, cards
  metadata: {
    items: JSON.stringify(lineItems),
    source: 'domecek-shop-pwa',
  },
});
```

### Stripe Payment Element

Use `<PaymentElement />` from `@stripe/react-stripe-js` — this single component automatically renders:
- Card input
- Apple Pay (Safari on Apple devices)
- Google Pay (Chrome on Android/desktop)
- Link (Stripe's 1-click checkout)

**Appearance:**
```typescript
const appearance: Appearance = {
  theme: 'flat',
  variables: {
    colorPrimary: '#1C1C1A',
    colorBackground: '#FDFAF6',
    colorText: '#1C1C1A',
    colorDanger: '#B94040',
    fontFamily: 'DM Sans, sans-serif',
    borderRadius: '8px',
  },
};
```

### Apple Pay / Google Pay Domain Verification

- Register the domain in Stripe Dashboard → Settings → Payment Methods → Wallets
- For Apple Pay: Stripe serves the verification file automatically when using `PaymentElement`
- For Google Pay: No additional domain verification needed beyond Stripe dashboard

---

## 12. Deployment

### 12.1 Vercel Setup

1. Connect GitHub repo to Vercel
2. Set all environment variables from Section 8 in Vercel dashboard
3. Set custom domain (e.g., `shop.domecekujosefa.cz`) via CNAME at DNS provider
4. Enable **Edge Network** for static assets

### 12.2 Database Connection

Hostinger MySQL does **not** support persistent connections well from serverless. Use:

```typescript
// lib/db/client.ts
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host:     process.env.DB_HOST,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false },  // Hostinger requires SSL
  connectTimeout: 10000,
});

export const db = drizzle(connection);
```

> ⚠️ **Important:** Hostinger shared MySQL may block remote connections. In Hostinger hPanel → Databases → Remote MySQL, add Vercel's outbound IP ranges. Alternatively, consider a **PlanetScale** or **Neon** MySQL-compatible DB as a drop-in replacement for zero-config serverless compatibility. Document both options.

### 12.3 Stripe Webhook

1. In Stripe Dashboard → Webhooks → Add endpoint
2. URL: `https://shop.domecekujosefa.cz/api/stripe/webhook`
3. Events to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed` (optional: for logging)
4. Copy signing secret → `STRIPE_WEBHOOK_SECRET` env var

### 12.4 Database Migrations

Run locally before first deploy:
```bash
npx drizzle-kit push:mysql
# or
npx drizzle-kit migrate
```

---

## 13. State Management

Use **React built-ins only** — no Redux, no Zustand. The app is small enough.

```typescript
// Basket state lives in a Context provider at app root
// lib/basket-context.tsx

interface BasketItem {
  id: number;
  name: string;
  priceCzk: number;
  quantity: number;
}

interface BasketContext {
  items: BasketItem[];
  addItem: (item: Omit<BasketItem, 'quantity'>) => void;
  removeItem: (id: number) => void;
  updateQuantity: (id: number, qty: number) => void;
  clearBasket: () => void;
  total: number;
  count: number;
}
```

Persist basket to `localStorage` so it survives page refreshes. Clear on successful payment.

---

## 14. Sample Seed Data

Pre-populate the database with these items (realistic for the business):

```sql
INSERT INTO items (name, description, price_czk, is_active, sort_order) VALUES
('Snídaně v košíku', 'Výborná snídaně donesená v předem dohodnutý čas. Nutno objednat do 12:00 předchozího dne.', 250.00, 1, 1),
('Koupací sud (1 den)', 'Pronájem koupacího sudu pro až 6 osob. Zatopení, úklid a ručníky v ceně.', 1000.00, 1, 2),
('Sauna (1 den)', 'Pronájem sauny pro až 6 osob. Zatopení, úklid a ručníky v ceně.', 1000.00, 1, 3),
('Úklid po mazlíčkovi', 'Příplatek za úklid po malém pejskovi.', 200.00, 1, 4),
('Dřevo do krbu (pytel)', 'Pytel suchého dřeva pro romantické večery u krbu.', 150.00, 0, 5);
```

---

## 15. Development Setup Instructions

```bash
# 1. Clone and install
git clone <repo>
cd domecek-shop
npm install

# 2. Environment
cp .env.local.example .env.local
# Fill in all values

# 3. Generate admin password hash
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('your-password', 10).then(console.log)"
# Paste result into ADMIN_PASSWORD_HASH

# 4. Push DB schema
npx drizzle-kit push:mysql

# 5. Seed data (optional)
npx tsx lib/db/seed.ts

# 6. Run dev server
npm run dev
# → http://localhost:3000       (shop)
# → http://localhost:3000/admin (admin, password protected)

# 7. Test Stripe webhooks locally
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

---

## 16. Key Dependencies

```json
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "typescript": "^5.4.0",
    "tailwindcss": "^3.4.0",
    "drizzle-orm": "^0.31.0",
    "mysql2": "^3.9.0",
    "stripe": "^15.0.0",
    "@stripe/stripe-js": "^3.4.0",
    "@stripe/react-stripe-js": "^2.7.0",
    "jose": "^5.3.0",
    "bcrypt": "^5.1.1",
    "resend": "^3.2.0",
    "lucide-react": "^0.378.0",
    "next-pwa": "^5.6.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.3.0"
  },
  "devDependencies": {
    "drizzle-kit": "^0.22.0",
    "@types/bcrypt": "^5.0.2",
    "@types/node": "^20.0.0",
    "@types/react": "^18.3.0"
  }
}
```

---

## 17. Acceptance Criteria

### Client Shop
- [ ] All active items display correctly with name, description, and formatted CZK price
- [ ] Add to basket works; quantity stepper shows when item already in basket
- [ ] Basket drawer slides in/out smoothly
- [ ] Checkout opens and shows Stripe Payment Element
- [ ] Apple Pay button appears on Safari/iOS
- [ ] Google Pay button appears on Chrome
- [ ] Successful payment shows SuccessScreen
- [ ] Customer receives HTML receipt email within 60 seconds
- [ ] Basket clears after payment

### Admin
- [ ] `/admin` redirects to `/admin/login` when not authenticated
- [ ] Wrong password shows error, correct password redirects to dashboard
- [ ] Admin can create, edit, delete items
- [ ] Toggle switches update item active status in real time
- [ ] Admin receives notification email for each sale
- [ ] Session expires after 24 hours

### PWA
- [ ] App installable on iOS and Android (Add to Home Screen)
- [ ] Lighthouse PWA score ≥ 90
- [ ] Works in standalone display mode
- [ ] Correct app icon and name shown on home screen

### Performance
- [ ] Lighthouse Performance ≥ 85 on mobile
- [ ] Core Web Vitals pass
- [ ] Fonts loaded with `display: swap`

---

## 18. Out of Scope (Future Enhancements)

- Multi-language support (Czech only for now)
- Inventory / stock limits
- Coupon/discount codes
- Order history view for admin
- Push notifications for new orders
- Integration with the main WordPress site booking calendar

---

*Specification prepared May 2026. Brand reference: domecekujosefa.cz. Contact: domecekujosefa@gmail.com*
