import { NextRequest, NextResponse } from 'next/server';
import { getSections, createSection } from '@/lib/store';
import { isAdminRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sections = getSections().sort((a, b) => a.sortOrder - b.sortOrder);
    return NextResponse.json(sections);
  } catch (err) {
    const e = err as Error;
    return NextResponse.json({ error: e.message }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, sortOrder = 0 } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Název sekce je povinný' }, { status: 400 });
    }

    const section = createSection({ name: name.trim(), sortOrder: Number(sortOrder) });
    return NextResponse.json(section, { status: 201 });
  } catch (err) {
    const e = err as Error;
    return NextResponse.json({ error: e.message }, { status: 503 });
  }
}
