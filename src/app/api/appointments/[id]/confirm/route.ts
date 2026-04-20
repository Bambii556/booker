import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { appointments } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
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

    if (appointment.status === 'confirmed') {
      return NextResponse.json({ 
        success: true, 
        message: 'Appointment already confirmed',
        data: appointment 
      });
    }

    if (appointment.status === 'cancelled') {
      return NextResponse.json(
        { success: false, error: 'ALREADY_CANCELLED', message: 'This appointment has been cancelled' },
        { status: 400 }
      );
    }

    if (appointment.status === 'archived') {
      return NextResponse.json(
        { success: false, error: 'ALREADY_ARCHIVED', message: 'This appointment has expired' },
        { status: 400 }
      );
    }

    try {
      await db.update(appointments)
        .set({ status: 'confirmed' })
        .where(eq(appointments.id, id));
    } catch (error) {
      const err = error as { cause?: unknown; code?: string };
      const code = err.code || (err.cause as { code?: string })?.code;
      
      if (code === '23505') {
        return NextResponse.json(
          { success: false, error: 'SLOT_TAKEN', message: 'Sorry! Someone else just booked this time slot. It happened while you were waiting.' },
          { status: 409 }
        );
      }
      throw error;
    }

    const updatedAppointment = await db.query.appointments.findFirst({
      where: eq(appointments.id, id),
      with: {
        branch: true,
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Appointment confirmed',
      data: updatedAppointment 
    });
  } catch (error) {
    console.error('Error confirming appointment:', error);
    return NextResponse.json(
      { success: false, error: 'CONFIRM_ERROR', message: 'Failed to confirm appointment' },
      { status: 500 }
    );
  }
}
