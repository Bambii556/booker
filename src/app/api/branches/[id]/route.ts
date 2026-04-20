import { db } from '@/lib/db';
import { branches } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const branch = await db.query.branches.findFirst({
      where: eq(branches.id, id),
    });

    if (!branch) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Branch not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: branch });
  } catch (error) {
    console.error('Error fetching branch:', error);
    return NextResponse.json(
      { success: false, error: 'FETCH_ERROR', message: 'Failed to fetch branch' },
      { status: 500 }
    );
  }
}
