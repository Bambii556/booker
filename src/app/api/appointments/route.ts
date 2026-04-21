import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { appointments, branches } from '@/lib/db/schema';
import { eq, and, or, desc } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { fromZonedTime } from 'date-fns-tz';
import { BookAppointmentSchema } from '@/lib/validations';
import {
  unauthorizedError,
  notFoundError,
  conflictError,
  internalError,
  handleZodError,
  isDatabaseConstraintError,
} from '@/lib/api-error';

function generateBookingReference(): string {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `APT-${year}-${random}`;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return unauthorizedError('You must be logged in');
    }

    const userAppointments = await db.query.appointments.findMany({
      where: eq(appointments.userId, session.user.id),
      with: {
        branch: true,
      },
      orderBy: [desc(appointments.scheduledAt)],
    });

    return NextResponse.json({ success: true, data: userAppointments });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return internalError('Failed to fetch appointments', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return unauthorizedError('You must be logged in');
    }

    const body = await request.json();
    const validation = BookAppointmentSchema.safeParse(body);

    if (!validation.success) {
      return handleZodError(validation.error);
    }

    const { branchId, scheduledAt } = validation.data;

    const branch = await db.query.branches.findFirst({
      where: eq(branches.id, branchId),
    });

    if (!branch) {
      return notFoundError('Branch not found');
    }

    const scheduledDate = new Date(scheduledAt);
    const scheduledAtUTC = fromZonedTime(scheduledDate, 'Africa/Johannesburg');
    
    const existingAppointment = await db.query.appointments.findFirst({
      where: and(
        eq(appointments.branchId, branchId),
        eq(appointments.scheduledAt, scheduledAtUTC),
        or(
          eq(appointments.status, 'pending'),
          eq(appointments.status, 'confirmed')
        )
      ),
    });

    if (existingAppointment) {
      return conflictError('This time slot is no longer available');
    }

    const bookingReference = generateBookingReference();

    const result = await db.insert(appointments).values({
      branchId,
      userId: session.user.id,
      scheduledAt: scheduledAtUTC,
      bookingReference,
      status: 'confirmed',
    }).returning();

    return NextResponse.json({ success: true, data: result[0] }, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating appointment:', error);
    
    if (isDatabaseConstraintError(error)) {
      return conflictError('This time slot was just booked by someone else');
    }

    return internalError('Failed to create appointment', error);
  }
}
