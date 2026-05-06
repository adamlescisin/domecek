import { SignJWT, jwtVerify } from 'jose';

const COOKIE_NAME = 'duj_admin_token';
const secret = () => new TextEncoder().encode(process.env.JWT_SECRET!);

export async function signAdminToken(): Promise<string> {
  return new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('24h')
    .setIssuedAt()
    .sign(secret());
}

export async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, secret());
    return true;
  } catch {
    return false;
  }
}

export async function getAdminTokenFromRequest(req: Request): Promise<string | null> {
  const cookie = req.headers.get('cookie') ?? '';
  const match = cookie.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  return match ? match[1] : null;
}

export async function isAdminRequest(req: Request): Promise<boolean> {
  const token = await getAdminTokenFromRequest(req);
  if (!token) return false;
  return verifyAdminToken(token);
}

export { COOKIE_NAME };
