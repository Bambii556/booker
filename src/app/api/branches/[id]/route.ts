import { db } from '@/lib/db';
import { branches } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { BranchIdSchema } from '@/lib/validations';
import { notFoundError, internalError, handleZodError } from '@/lib/api-error';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const validation = BranchIdSchema.safeParse({ id });

    if (!validation.success) {
      return handleZodError(validation.error);
    }

    const branch = await db.query.branches.findFirst({
      where: eq(branches.id, id),
    });

    if (!branch) {
      return notFoundError('Branch not found');
    }

    return NextResponse.json({ success: true, data: branch });
  } catch (error) {
    console.error('Error fetching branch:', error);
    return internalError('Failed to fetch branch', error);
  }
}
