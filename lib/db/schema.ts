import { mysqlTable, int, varchar, text, decimal, tinyint, json, datetime } from 'drizzle-orm/mysql-core';

export const sections = mysqlTable('sections', {
  id:        int('id').autoincrement().primaryKey(),
  name:      varchar('name', { length: 200 }).notNull(),
  sortOrder: int('sort_order').notNull().default(0),
  createdAt: datetime('created_at').notNull(),
});

export const items = mysqlTable('items', {
  id:          int('id').autoincrement().primaryKey(),
  name:        varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  priceCzk:    decimal('price_czk', { precision: 10, scale: 2 }).notNull(),
  isActive:    tinyint('is_active').notNull().default(1),
  sortOrder:   int('sort_order').notNull().default(0),
  sectionId:   int('section_id'),
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

// Generic key→JSON value store for app settings (languages, exchange rates, …)
export const settings = mysqlTable('settings', {
  key:       varchar('key', { length: 100 }).notNull().primaryKey(),
  value:     json('value').notNull(),
  updatedAt: datetime('updated_at').notNull(),
});

// Per-entity translated strings  (items / sections, any text field)
export const translations = mysqlTable('translations', {
  id:         int('id').autoincrement().primaryKey(),
  entityType: varchar('entity_type', { length: 50 }).notNull(),  // 'item' | 'section'
  entityId:   int('entity_id').notNull(),
  langCode:   varchar('lang_code', { length: 10 }).notNull(),
  field:      varchar('field', { length: 100 }).notNull(),       // 'name' | 'description'
  value:      text('value').notNull(),
});
