import { readFileSync, writeFileSync, existsSync, mkdirSync, accessSync, constants } from 'fs';
import path from 'path';
import os from 'os';

// Resolve a writable data directory.  Priority:
//   1. DATA_DIR env var (explicit, preferred in production)
//   2. ~/domecek-data  (works when os.homedir() actually exists on disk)
//   3. ../domecek-data relative to process.cwd() — one level above the app
//      root, always writable in Hostinger's Node.js sandbox even when the
//      sandbox home (/home/sbx_userXXX) does not exist.
function isDirWritable(dir: string): boolean {
  try {
    accessSync(dir, constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

function resolveDataDir(): string {
  if (process.env.DATA_DIR) return path.resolve(process.env.DATA_DIR);
  const homeDir = os.homedir();
  if (existsSync(homeDir) && isDirWritable(homeDir)) return path.join(homeDir, 'domecek-data');
  // On Vercel / AWS Lambda process.cwd() is /var/task (read-only).
  // /tmp is the only writable location in that environment — but it is
  // ephemeral: data is lost on cold starts and is NOT shared between
  // concurrent function instances.  Set DATA_DIR to a persistent store
  // (e.g. a mounted volume on a VPS) to avoid data loss.
  if (isDirWritable('/tmp')) return '/tmp/domecek-data';
  return path.resolve(process.cwd(), '..', 'domecek-data');
}

export const DATA_DIR = resolveDataDir();

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    try {
      mkdirSync(DATA_DIR, { recursive: true });
    } catch (err) {
      throw new Error(`Cannot create data directory "${DATA_DIR}": ${(err as Error).message}`);
    }
  }
}

function readJson<T>(filename: string, fallback: T): T {
  ensureDataDir();
  const fp = path.join(DATA_DIR, filename);
  if (!existsSync(fp)) {
    writeFileSync(fp, JSON.stringify(fallback, null, 2), 'utf-8');
    return fallback;
  }
  const raw = readFileSync(fp, 'utf-8').trim();
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    // File is corrupt — overwrite with fallback so the next request succeeds.
    writeFileSync(fp, JSON.stringify(fallback, null, 2), 'utf-8');
    return fallback;
  }
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
