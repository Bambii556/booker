import { getLockInfo } from '@/lib/locks';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId');
    const slotTime = searchParams.get('slotTime');

    if (!branchId || !slotTime) {
      return NextResponse.json(
        { success: false, error: 'MISSING_PARAMS', message: 'Branch ID and slot time are required' },
        { status: 400 }
      );
    }

    const slotDate = new Date(slotTime);
    const lockInfo = await getLockInfo(branchId, slotDate);

    return NextResponse.json({
      success: true,
      data: {
        locked: lockInfo.locked,
        userId: lockInfo.userId,
        ttl: lockInfo.ttl,
        expiresAt: lockInfo.expiresAt?.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error getting lock info:', error);
    return NextResponse.json(
      { success: false, error: 'LOCK_ERROR', message: 'Failed to get lock info' },
      { status: 500 }
    );
  }
}