import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

function readJson<T>(filename: string, fallback: T): T {
  ensureDataDir();
  const fp = path.join(DATA_DIR, filename);
  if (!existsSync(fp)) {
    writeFileSync(fp, JSON.stringify(fallback, null, 2), 'utf-8');
    return fallback;
  }
  return JSON.parse(readFileSync(fp, 'utf-8')) as T;
}

function writeJson<T>(filename: string, data: T): void {
  ensureDataDir();
  writeFileSync(path.join(DATA_DIR, filename), JSON.stringify(data, null, 2), 'utf-8');
}

export interface Section {
  id: number;
  name: string;
  sortOrder: number;
  createdAt: string;
}

export interface Item {
  id: number;
  name: string;
  description: string | null;
  priceCzk: string;
  isActive: number;
  sortOrder: number;
  sectionId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: number;
  stripePaymentId: string;
  stripeStatus: string;
  totalCzk: string;
  customerEmail: string;
  customerName: string;
  lineItems: unknown[];
  createdAt: string;
}

// ── Sections ─────────────────────────────────────────────────────────────────

export function getSections(): Section[] {
  return readJson<Section[]>('sections.json', []);
}

function saveSections(sections: Section[]): void {
  writeJson('sections.json', sections);
}

export function createSection(data: Omit<Section, 'id' | 'createdAt'>): Section {
  const sections = getSections();
  const nextId = sections.length > 0 ? Math.max(...sections.map((s) => s.id)) + 1 : 1;
  const section: Section = { id: nextId, ...data, createdAt: new Date().toISOString() };
  saveSections([...sections, section]);
  return section;
}

export function updateSection(
  id: number,
  updates: Partial<Omit<Section, 'id' | 'createdAt'>>
): Section | null {
  const sections = getSections();
  const idx = sections.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  const updated: Section = { ...sections[idx], ...updates };
  sections[idx] = updated;
  saveSections(sections);
  return updated;
}

export function deleteSection(id: number): boolean {
  const sections = getSections();
  const next = sections.filter((s) => s.id !== id);
  if (next.length === sections.length) return false;
  saveSections(next);
  return true;
}

// ── Items ────────────────────────────────────────────────────────────────────

export function getItems(): Item[] {
  return readJson<Item[]>('items.json', []);
}

function saveItems(items: Item[]): void {
  writeJson('items.json', items);
}

export function createItem(data: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>): Item {
  const items = getItems();
  const nextId = items.length > 0 ? Math.max(...items.map((i) => i.id)) + 1 : 1;
  const now = new Date().toISOString();
  const item: Item = { id: nextId, ...data, createdAt: now, updatedAt: now };
  saveItems([...items, item]);
  return item;
}

export function updateItem(
  id: number,
  updates: Partial<Omit<Item, 'id' | 'createdAt'>>
): Item | null {
  const items = getItems();
  const idx = items.findIndex((i) => i.id === id);
  if (idx === -1) return null;
  const updated: Item = { ...items[idx], ...updates, updatedAt: new Date().toISOString() };
  items[idx] = updated;
  saveItems(items);
  return updated;
}

export function deleteItem(id: number): boolean {
  const items = getItems();
  const next = items.filter((i) => i.id !== id);
  if (next.length === items.length) return false;
  saveItems(next);
  return true;
}

// ── Orders ───────────────────────────────────────────────────────────────────

export function getOrders(): Order[] {
  return readJson<Order[]>('orders.json', []);
}

function saveOrders(orders: Order[]): void {
  writeJson('orders.json', orders);
}

export function upsertOrder(data: Omit<Order, 'id'>): Order {
  const orders = getOrders();
  const existingIdx = orders.findIndex((o) => o.stripePaymentId === data.stripePaymentId);
  if (existingIdx !== -1) {
    orders[existingIdx] = { ...orders[existingIdx], stripeStatus: data.stripeStatus };
    saveOrders(orders);
    return orders[existingIdx];
  }
  const nextId = orders.length > 0 ? Math.max(...orders.map((o) => o.id)) + 1 : 1;
  const order: Order = { id: nextId, ...data };
  saveOrders([...orders, order]);
  return order;
}
