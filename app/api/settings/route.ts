import { NextRequest, NextResponse } from 'next/server';
import { getSettings, upsertSettings } from '@/lib/store';
import { isAdminRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const key = new URL(req.url).searchParams.get('key') ?? 'languages';
  try {
    const value = await getSettings(key);
    return NextResponse.json({ key, value: value ?? null });
  } catch (err) {
    const e = err as Error;
    console.error('GET /api/settings error:', e.message);
    return NextResponse.json({ key, value: null, error: e.message }, { status: 503 });
  }
}

export async function PUT(req: NextRequest) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { key, value } = await req.json();
  if (!key) return NextResponse.json({ error: 'key required' }, { status: 400 });
  try {
    await upsertSettings(key, value);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const e = err as Error;
    console.error('PUT /api/settings error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 503 });
  }
}
