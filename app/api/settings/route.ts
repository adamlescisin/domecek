import { NextRequest, NextResponse } from 'next/server';
import { getSettings, upsertSettings } from '@/lib/store';
import { isAdminRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const key = new URL(req.url).searchParams.get('key') ?? 'languages';
  const value = await getSettings(key);
  return NextResponse.json({ key, value: value ?? null });
}

export async function PUT(req: NextRequest) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { key, value } = await req.json();
  if (!key) return NextResponse.json({ error: 'key required' }, { status: 400 });
  await upsertSettings(key, value);
  return NextResponse.json({ ok: true });
}
