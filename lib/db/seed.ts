import { getDb } from './client';
import { items } from './schema';

async function seed() {
  const db = await getDb();
  const now = new Date();

  await db.insert(items).values([
    {
      name: 'Snídaně v košíku',
      description: 'Výborná snídaně donesená v předem dohodnutý čas. Nutno objednat do 12:00 předchozího dne.',
      priceCzk: '250.00',
      isActive: 1,
      sortOrder: 1,
      createdAt: now,
      updatedAt: now,
    },
    {
      name: 'Koupací sud (1 den)',
      description: 'Pronájem koupacího sudu pro až 6 osob. Zatopení, úklid a ručníky v ceně.',
      priceCzk: '1000.00',
      isActive: 1,
      sortOrder: 2,
      createdAt: now,
      updatedAt: now,
    },
    {
      name: 'Sauna (1 den)',
      description: 'Pronájem sauny pro až 6 osob. Zatopení, úklid a ručníky v ceně.',
      priceCzk: '1000.00',
      isActive: 1,
      sortOrder: 3,
      createdAt: now,
      updatedAt: now,
    },
    {
      name: 'Úklid po mazlíčkovi',
      description: 'Příplatek za úklid po malém pejskovi.',
      priceCzk: '200.00',
      isActive: 1,
      sortOrder: 4,
      createdAt: now,
      updatedAt: now,
    },
    {
      name: 'Dřevo do krbu (pytel)',
      description: 'Pytel suchého dřeva pro romantické večery u krbu.',
      priceCzk: '150.00',
      isActive: 0,
      sortOrder: 5,
      createdAt: now,
      updatedAt: now,
    },
  ]);

  console.log('Seed data inserted successfully.');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
