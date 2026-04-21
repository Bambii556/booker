import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { appointments } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import {
  unauthorizedError,
  notFoundError,
  internalError,
} from "@/lib/api-error";
import { sendEmail } from "@/lib/notifications";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return unauthorizedError("You must be logged in");
    }

    const { id } = await params;

    const appointment = await db.query.appointments.findFirst({
      where: and(
        eq(appointments.id, id),
        eq(appointments.userId, session.user.id),
      ),
      with: {
        branch: true,
      },
    });

    if (!appointment) {
      return notFoundError("Appointment not found");
    }

    return NextResponse.json({ success: true, data: appointment });
  } catch (error) {
    console.error("Error fetching appointment:", error);
    return internalError("Failed to fetch appointment", error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return unauthorizedError("You must be logged in");
    }

    const { id } = await params;

    const appointment = await db.query.appointments.findFirst({
      where: and(
        eq(appointments.id, id),
        eq(appointments.userId, session.user.id),
      ),
      with: { branch: true },
    });

    if (!appointment) {
      return notFoundError("Appointment not found");
    }

    await db
      .update(appointments)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(eq(appointments.id, id));

    await sendEmail({
      userId: session.user.id,
      to: session.user.email,
      subject: `Appointment Cancelled – ${appointment.bookingReference}`,
      type: 'booking_cancellation',
      data: {
        bookingReference: appointment.bookingReference,
        branchName: appointment.branch.name,
        branchAddress: appointment.branch.address,
        scheduledAt: appointment.scheduledAt,
      },
    });

    return NextResponse.json({ success: true, message: "Appointment cancelled" });
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    return internalError("Failed to cancel appointment", error);
  }
}
