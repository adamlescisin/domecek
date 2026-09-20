import { NextRequest, NextResponse } from 'next/server';
import { getTranslationsForLang, upsertTranslation } from '@/lib/store';
import { isAdminRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const lang = new URL(req.url).searchParams.get('lang');
  if (!lang) return NextResponse.json({ error: 'lang required' }, { status: 400 });
  const rows = await getTranslationsForLang(lang);
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { entityType, entityId, langCode, field, value } = await req.json();
  if (!entityType || !entityId || !langCode || !field) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }
  await upsertTranslation(entityType, entityId, langCode, field, value ?? '');
  return NextResponse.json({ ok: true });
}
