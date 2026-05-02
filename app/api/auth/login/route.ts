import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { signAdminToken, COOKIE_NAME } from '@/lib/auth';

const attempts = new Map<string, { count: number; resetAt: number }>();

function getIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || entry.resetAt < now) {
    attempts.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return false;
  }
  entry.count++;
  if (entry.count > 5) return true;
  return false;
}

export async function POST(req: NextRequest) {
  const ip = getIp(req);
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Příliš mnoho pokusů. Zkuste to za 15 minut.' }, { status: 429 });
  }

  const { password } = await req.json();
  if (!password) {
    return NextResponse.json({ error: 'Nesprávné heslo' }, { status: 401 });
  }

  const hash = Buffer.from(process.env.ADMIN_PASSWORD_HASH!, 'base64').toString('utf8');
  const valid = await bcrypt.compare(password, hash);
  if (!valid) {
    return NextResponse.json({ error: 'Nesprávné heslo' }, { status: 401 });
  }

  const token = await signAdminToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24,
    path: '/',
  });
  return res;
}
