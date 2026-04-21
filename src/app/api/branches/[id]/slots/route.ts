import { db } from "@/lib/db";
import { branches, appointments } from "@/lib/db/schema";
import { eq, and, gte, lt } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { startOfDay, endOfDay, parse } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import { generateSlots } from "@/lib/slots";
import { checkLock } from "@/lib/locks";
import type { BranchWithAvailability } from "@/types";
import { BranchIdSchema, SlotDateQuerySchema } from "@/lib/validations";
import {
  notFoundError,
  internalError,
  handleZodError,
} from "@/lib/api-error";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const branchValidation = BranchIdSchema.safeParse({ id });

    if (!branchValidation.success) {
      return handleZodError(branchValidation.error);
    }

    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get("date");

    if (!dateStr) {
      return NextResponse.json(
        {
          success: false,
          error: "MISSING_DATE",
          message: "Date parameter is required",
        },
        { status: 400 },
      );
    }

    const dateValidation = SlotDateQuerySchema.safeParse({ date: dateStr });

    if (!dateValidation.success) {
      return handleZodError(dateValidation.error);
    }

    const branch = await db.query.branches.findFirst({
      where: eq(branches.id, id),
    });

    if (!branch) {
      return notFoundError("Branch not found");
    }

    const selectedDate = parse(dateStr, "yyyy-MM-dd", new Date());
    const dayStart = startOfDay(selectedDate);
    const dayEnd = endOfDay(selectedDate);

    const dayStartUTC = fromZonedTime(dayStart, "Africa/Johannesburg");
    const dayEndUTC = fromZonedTime(dayEnd, "Africa/Johannesburg");

    const bookedAppointments = await db.query.appointments.findMany({
      where: and(
        eq(appointments.branchId, id),
        gte(appointments.scheduledAt, dayStartUTC),
        lt(appointments.scheduledAt, dayEndUTC),
        eq(appointments.status, "confirmed"),
      ),
    });

    const bookedTimes = bookedAppointments.map((a) => a.scheduledAt);

    const branchData: BranchWithAvailability = {
      id: branch.id,
      name: branch.name,
      address: branch.address,
      openingTime: branch.openingTime,
      closingTime: branch.closingTime,
      timezone: branch.timezone,
    };

    const allSlots = generateSlots(branchData, selectedDate, bookedTimes);

    const slotsWithLocks = await Promise.all(
      allSlots.map(async (slot) => {
        const isLocked = await checkLock(id, slot.time);
        return {
          ...slot,
          locked: isLocked,
        };
      }),
    );

    return NextResponse.json({
      success: true,
      data: {
        date: dateStr,
        slots: slotsWithLocks,
      },
    });
  } catch (error) {
    console.error("Error fetching slots:", error);
    return internalError("Failed to fetch slots", error);
  }
}
