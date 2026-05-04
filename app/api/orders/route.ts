import { NextRequest, NextResponse } from 'next/server';
import { getOrders } from '@/lib/store';
import { isAdminRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const orders = getOrders();
  // newest first
  return NextResponse.json([...orders].sort((a, b) => b.id - a.id));
}
