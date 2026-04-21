import { auth } from '@/lib/auth';
import { getUserLock, getLockInfo } from '@/lib/locks';
import { db } from '@/lib/db';
import { branches } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: 'You must be logged in' },
        { status: 401 },
      );
    }

    const userLock = await getUserLock(session.user.id);
    if (!userLock) {
      return NextResponse.json({ success: true, data: { locked: false } });
    }

    const slotDate = new Date(userLock.slotTime);
    const lockInfo = await getLockInfo(userLock.branchId, slotDate);

    // User-index exists but slot lock expired — stale, report no lock
    if (!lockInfo.locked || lockInfo.userId !== session.user.id) {
      return NextResponse.json({ success: true, data: { locked: false } });
    }

    const branch = await db.query.branches.findFirst({
      where: eq(branches.id, userLock.branchId),
    });

    if (!branch) {
      return NextResponse.json({ success: true, data: { locked: false } });
    }

    return NextResponse.json({
      success: true,
      data: {
        locked: true,
        branchId: branch.id,
        branchName: branch.name,
        branchAddress: branch.address,
        slotTime: userLock.slotTime,
        ttl: lockInfo.ttl,
      },
    });
  } catch (error) {
    console.error('Error fetching user lock:', error);
    return NextResponse.json(
      { success: false, error: 'LOCK_ERROR', message: 'Failed to get lock info' },
      { status: 500 },
    );
  }
}
