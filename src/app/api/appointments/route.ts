import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { appointments, branches } from '@/lib/db/schema';
import { eq, and, or, desc } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { fromZonedTime } from 'date-fns-tz';

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
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: 'You must be logged in' },
        { status: 401 }
      );
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
    return NextResponse.json(
      { success: false, error: 'FETCH_ERROR', message: 'Failed to fetch appointments' },
      { status: 500 }
    );
  }
}

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
    const { branchId, scheduledAt } = body;

    if (!branchId || !scheduledAt) {
      return NextResponse.json(
        { success: false, error: 'VALIDATION_ERROR', message: 'Branch ID and scheduled time are required' },
        { status: 400 }
      );
    }

    const branch = await db.query.branches.findFirst({
      where: eq(branches.id, branchId),
    });

    if (!branch) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Branch not found' },
        { status: 404 }
      );
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
      return NextResponse.json(
        { success: false, error: 'SLOT_TAKEN', message: 'This time slot is no longer available' },
        { status: 409 }
      );
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
    
    if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
      return NextResponse.json(
        { success: false, error: 'SLOT_TAKEN', message: 'This time slot was just booked by someone else' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'CREATE_ERROR', message: 'Failed to create appointment' },
      { status: 500 }
    );
  }
}
