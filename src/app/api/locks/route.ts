import { auth } from '@/lib/auth';
import { acquireLock, releaseLock, getLockInfo } from '@/lib/locks';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: 'You must be logged in' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { branchId, slotTime, ttlSeconds } = body;

    if (!branchId || !slotTime) {
      return NextResponse.json(
        { success: false, error: 'MISSING_PARAMS', message: 'Branch ID and slot time are required' },
        { status: 400 }
      );
    }

    const slotDate = new Date(slotTime);
    const success = await acquireLock(branchId, slotDate, session.user.id, ttlSeconds);

    if (!success) {
      const lockInfo = await getLockInfo(branchId, slotDate);
      
      if (lockInfo.locked && lockInfo.userId === session.user.id) {
        return NextResponse.json(
          { success: true, message: 'Lock already held', ttl: lockInfo.ttl },
          { status: 200 }
        );
      }

      return NextResponse.json(
        { 
          success: false, 
          error: 'SLOT_LOCKED', 
          message: 'This slot is being booked by another user',
          ttl: lockInfo.ttl 
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Lock acquired', ttl: ttlSeconds ?? 300 },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error acquiring lock:', error);
    return NextResponse.json(
      { success: false, error: 'LOCK_ERROR', message: 'Failed to acquire lock' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: 'You must be logged in' },
        { status: 401 }
      );
    }

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
    const success = await releaseLock(branchId, slotDate, session.user.id);

    return NextResponse.json(
      { success, message: success ? 'Lock released' : 'Lock not found' }
    );
  } catch (error) {
    console.error('Error releasing lock:', error);
    return NextResponse.json(
      { success: false, error: 'LOCK_ERROR', message: 'Failed to release lock' },
      { status: 500 }
    );
  }
}