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
      // Check if appointment exists at all (for debugging)
      const anyAppointment = await db.query.appointments.findFirst({
        where: eq(appointments.id, id),
      });
      if (anyAppointment) {
        console.log(
          "Appointment exists but user mismatch:",
          anyAppointment.userId,
        );
        return notFoundError("Appointment not found");
      }
      return notFoundError("Appointment not found");
    }

    console.log("Found appointment:", appointment.id);

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
    });

    if (!appointment) {
      return notFoundError("Appointment not found");
    }

    await db.delete(appointments).where(eq(appointments.id, id));

    return NextResponse.json({ success: true, message: "Appointment deleted" });
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    return internalError("Failed to cancel appointment", error);
  }
}
