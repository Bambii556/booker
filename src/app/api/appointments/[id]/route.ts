import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { appointments } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    const appointment = await db.query.appointments.findFirst({
      where: and(
        eq(appointments.id, id),
        eq(appointments.userId, session.user.id)
      ),
      with: {
        branch: true,
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Appointment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: appointment });
  } catch (error) {
    console.error('Error fetching appointment:', error);
    return NextResponse.json(
      { success: false, error: 'FETCH_ERROR', message: 'Failed to fetch appointment' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    const appointment = await db.query.appointments.findFirst({
      where: and(
        eq(appointments.id, id),
        eq(appointments.userId, session.user.id)
      ),
    });

    if (!appointment) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Appointment not found' },
        { status: 404 }
      );
    }

    await db.delete(appointments).where(eq(appointments.id, id));

    return NextResponse.json({ success: true, message: 'Appointment deleted' });
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    return NextResponse.json(
      { success: false, error: 'DELETE_ERROR', message: 'Failed to cancel appointment' },
      { status: 500 }
    );
  }
}
