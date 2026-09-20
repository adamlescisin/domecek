import { eq, and } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import {
  sections as sectionsTable,
  items as itemsTable,
  orders as ordersTable,
  settings as settingsTable,
  translations as translationsTable,
} from '@/lib/db/schema';

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

export type AppSettings = {
  languages?: Array<{ code: string; name: string; currency: string; symbol: string; rateFromCzk: number }>;
  [key: string]: unknown;
};

// ── helpers ──────────────────────────────────────────────────────────────────

function toIso(d: Date | string): string {
  return d instanceof Date ? d.toISOString() : d;
}

type InsertResult = { insertId: number };
type DeleteResult = { affectedRows: number };

// ── Sections ─────────────────────────────────────────────────────────────────

export async function getSections(): Promise<Section[]> {
  const rows = await getDb().select().from(sectionsTable);
  return rows.map((r) => ({ ...r, createdAt: toIso(r.createdAt) }));
}

export async function createSection(data: Omit<Section, 'id' | 'createdAt'>): Promise<Section> {
  const now = new Date();
  const result = (await getDb()
    .insert(sectionsTable)
    .values({ name: data.name, sortOrder: data.sortOrder, createdAt: now })) as unknown as InsertResult;
  return { id: result.insertId, ...data, createdAt: now.toISOString() };
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
  const result = (await getDb()
    .delete(sectionsTable)
    .where(eq(sectionsTable.id, id))) as unknown as DeleteResult;
  return result.affectedRows > 0;
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
  const result = (await getDb()
    .insert(itemsTable)
    .values({ ...data, createdAt: now, updatedAt: now })) as unknown as InsertResult;
  return { id: result.insertId, ...data, createdAt: now.toISOString(), updatedAt: now.toISOString() };
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
  const result = (await getDb()
    .delete(itemsTable)
    .where(eq(itemsTable.id, id))) as unknown as DeleteResult;
  return result.affectedRows > 0;
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

  const result = (await db.insert(ordersTable).values({
    stripePaymentId: data.stripePaymentId,
    stripeStatus:    data.stripeStatus,
    totalCzk:        data.totalCzk,
    customerEmail:   data.customerEmail,
    customerName:    data.customerName,
    lineItems:       data.lineItems,
    createdAt:       new Date(data.createdAt),
  })) as unknown as InsertResult;

  return { ...data, id: result.insertId };
}

// ── Settings ─────────────────────────────────────────────────────────────────

export async function getSettings(key: string): Promise<unknown | null> {
  const rows = await getDb()
    .select()
    .from(settingsTable)
    .where(eq(settingsTable.key, key));
  return rows.length ? rows[0].value : null;
}

export async function upsertSettings(key: string, value: unknown): Promise<void> {
  const db = getDb();
  const existing = await db.select().from(settingsTable).where(eq(settingsTable.key, key));
  const now = new Date();
  if (existing.length) {
    await db.update(settingsTable).set({ value, updatedAt: now }).where(eq(settingsTable.key, key));
  } else {
    await db.insert(settingsTable).values({ key, value, updatedAt: now });
  }
}

// ── Translations ─────────────────────────────────────────────────────────────

export type Translation = {
  id: number;
  entityType: string;
  entityId: number;
  langCode: string;
  field: string;
  value: string;
};

export async function getTranslationsForLang(langCode: string): Promise<Translation[]> {
  const rows = await getDb()
    .select()
    .from(translationsTable)
    .where(eq(translationsTable.langCode, langCode));
  return rows;
}

export async function upsertTranslation(
  entityType: string,
  entityId: number,
  langCode: string,
  field: string,
  value: string,
): Promise<void> {
  const db = getDb();
  const existing = await db
    .select()
    .from(translationsTable)
    .where(
      and(
        eq(translationsTable.entityType, entityType),
        eq(translationsTable.entityId, entityId),
        eq(translationsTable.langCode, langCode),
        eq(translationsTable.field, field),
      ),
    );

  if (existing.length) {
    await db
      .update(translationsTable)
      .set({ value })
      .where(eq(translationsTable.id, existing[0].id));
  } else {
    await db.insert(translationsTable).values({ entityType, entityId, langCode, field, value });
  }
}

export async function deleteTranslationsForEntity(entityType: string, entityId: number): Promise<void> {
  await getDb()
    .delete(translationsTable)
    .where(
      and(
        eq(translationsTable.entityType, entityType),
        eq(translationsTable.entityId, entityId),
      ),
    );
}
