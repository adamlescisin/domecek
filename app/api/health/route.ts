import { NextResponse } from 'next/server';
import { getItems, getOrders, DATA_DIR } from '@/lib/store';
import { existsSync, writeFileSync, unlinkSync } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Test whether the data directory is writable before attempting a real read.
  let writable = false;
  let writeError: string | null = null;
  const testFile = path.join(DATA_DIR, '.healthcheck');
  try {
    writeFileSync(testFile, '1', 'utf-8');
    unlinkSync(testFile);
    writable = true;
  } catch (err) {
    writeError = (err as Error).message;
  }

  try {
    const items = getItems();
    const orders = getOrders();
    return NextResponse.json({
      ok: true,
      dataDir: DATA_DIR,
      dataDirExists: existsSync(DATA_DIR),
      writable,
      items: items.length,
      orders: orders.length,
      env: {
        DATA_DIR: process.env.DATA_DIR ?? '(not set — using os.homedir)',
        ADMIN_PASSWORD: !!process.env.ADMIN_PASSWORD,
        JWT_SECRET: !!process.env.JWT_SECRET,
        STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
      },
    });
  } catch (err) {
    const e = err as Error;
    return NextResponse.json(
      {
        ok: false,
        dataDir: DATA_DIR,
        dataDirExists: existsSync(DATA_DIR),
        writable,
        writeError,
        error: e.message,
        env: {
          DATA_DIR: process.env.DATA_DIR ?? '(not set — using os.homedir)',
          ADMIN_PASSWORD: !!process.env.ADMIN_PASSWORD,
          JWT_SECRET: !!process.env.JWT_SECRET,
          STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
        },
      },
      { status: 503 },
    );
  }
}
