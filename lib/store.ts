import { eq } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { sections as sectionsTable, items as itemsTable, orders as ordersTable } from '@/lib/db/schema';

export type Section = {
  id: number;
  name: string;
  sortOrder: number;
  createdAt: string;
};

export type Item = {
  id: number;
  name: string;
  description: string | null;
  priceCzk: string;
  isActive: number;
  sortOrder: number;
  sectionId: number | null;
  createdAt: string;
  updatedAt: string;
};

export type Order = {
  id: number;
  stripePaymentId: string;
  stripeStatus: string;
  totalCzk: string;
  customerEmail: string;
  customerName: string;
  lineItems: unknown[];
  createdAt: string;
};

// ── helpers ──────────────────────────────────────────────────────────────────

function toIso(d: Date | string): string {
  return d instanceof Date ? d.toISOString() : d;
}

// ── Sections ─────────────────────────────────────────────────────────────────

export async function getSections(): Promise<Section[]> {
  const rows = await getDb().select().from(sectionsTable);
  return rows.map((r) => ({ ...r, createdAt: toIso(r.createdAt) }));
}

export async function createSection(data: Omit<Section, 'id' | 'createdAt'>): Promise<Section> {
  const now = new Date();
  const [result] = await getDb()
    .insert(sectionsTable)
    .values({ name: data.name, sortOrder: data.sortOrder, createdAt: now });
  const id = (result as { insertId: number }).insertId;
  return { id, ...data, createdAt: now.toISOString() };
}

export async function updateSection(
  id: number,
  updates: Partial<Omit<Section, 'id' | 'createdAt'>>,
): Promise<Section | null> {
  await getDb().update(sectionsTable).set(updates).where(eq(sectionsTable.id, id));
  const rows = await getDb().select().from(sectionsTable).where(eq(sectionsTable.id, id));
  if (!rows.length) return null;
  return { ...rows[0], createdAt: toIso(rows[0].createdAt) };
}

export async function deleteSection(id: number): Promise<boolean> {
  const [result] = await getDb().delete(sectionsTable).where(eq(sectionsTable.id, id));
  return (result as { affectedRows: number }).affectedRows > 0;
}

// ── Items ────────────────────────────────────────────────────────────────────

export async function getItems(): Promise<Item[]> {
  const rows = await getDb().select().from(itemsTable);
  return rows.map((r) => ({
    ...r,
    priceCzk: String(r.priceCzk),
    sectionId: r.sectionId ?? null,
    createdAt: toIso(r.createdAt),
    updatedAt: toIso(r.updatedAt),
  }));
}

export async function createItem(data: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>): Promise<Item> {
  const now = new Date();
  const [result] = await getDb()
    .insert(itemsTable)
    .values({ ...data, createdAt: now, updatedAt: now });
  const id = (result as { insertId: number }).insertId;
  return { id, ...data, createdAt: now.toISOString(), updatedAt: now.toISOString() };
}

export async function updateItem(
  id: number,
  updates: Partial<Omit<Item, 'id' | 'createdAt'>>,
): Promise<Item | null> {
  const dbUpdates: Record<string, unknown> = { ...updates, updatedAt: new Date() };
  await getDb().update(itemsTable).set(dbUpdates).where(eq(itemsTable.id, id));
  const rows = await getDb().select().from(itemsTable).where(eq(itemsTable.id, id));
  if (!rows.length) return null;
  const r = rows[0];
  return {
    ...r,
    priceCzk: String(r.priceCzk),
    sectionId: r.sectionId ?? null,
    createdAt: toIso(r.createdAt),
    updatedAt: toIso(r.updatedAt),
  };
}

export async function deleteItem(id: number): Promise<boolean> {
  const [result] = await getDb().delete(itemsTable).where(eq(itemsTable.id, id));
  return (result as { affectedRows: number }).affectedRows > 0;
}

// ── Orders ───────────────────────────────────────────────────────────────────

export async function getOrders(): Promise<Order[]> {
  const rows = await getDb().select().from(ordersTable);
  return rows.map((r) => ({
    ...r,
    totalCzk: String(r.totalCzk),
    customerEmail: r.customerEmail ?? '',
    customerName: r.customerName ?? '',
    lineItems: r.lineItems as unknown[],
    createdAt: toIso(r.createdAt),
  }));
}

export async function upsertOrder(data: Omit<Order, 'id'>): Promise<Order> {
  const db = getDb();
  const existing = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.stripePaymentId, data.stripePaymentId));

  if (existing.length) {
    await db
      .update(ordersTable)
      .set({ stripeStatus: data.stripeStatus })
      .where(eq(ordersTable.stripePaymentId, data.stripePaymentId));
    return { ...data, id: existing[0].id };
  }

  const [result] = await db.insert(ordersTable).values({
    stripePaymentId: data.stripePaymentId,
    stripeStatus:    data.stripeStatus,
    totalCzk:        data.totalCzk,
    customerEmail:   data.customerEmail,
    customerName:    data.customerName,
    lineItems:       data.lineItems,
    createdAt:       new Date(data.createdAt),
  });
  return { ...data, id: (result as { insertId: number }).insertId };
}
