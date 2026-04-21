import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { appointments } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { AppointmentIdSchema } from '@/lib/validations';
import {
  unauthorizedError,
  notFoundError,
  conflictError,
  internalError,
  handleZodError,
} from '@/lib/api-error';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return unauthorizedError('You must be logged in');
    }

    const { id } = await params;
    const validation = AppointmentIdSchema.safeParse({ id });

    if (!validation.success) {
      return handleZodError(validation.error);
    }

    const appointment = await db.query.appointments.findFirst({
      where: and(
        eq(appointments.id, id),
        eq(appointments.userId, session.user.id)
      ),
    });

    if (!appointment) {
      return notFoundError('Appointment not found');
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
        return conflictError('Sorry! Someone else just booked this time slot. It happened while you were waiting.');
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
    return internalError('Failed to confirm appointment', error);
  }
}
