"use client";

import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { Clock, Lock } from "lucide-react";
import type { Slot } from "@/types";
import { cn } from "@/lib/utils";

interface SlotGridProps {
  slots: Slot[];
  selectedSlot: Date | null;
  onSlotSelect: (slot: Slot) => void;
  loading?: boolean;
  userLockedSlot?: Date | null;
}

export function SlotGrid({
  slots,
  selectedSlot,
  onSlotSelect,
  loading,
  userLockedSlot,
}: SlotGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="h-12 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        <Clock className="h-10 w-10 mx-auto mb-2 opacity-40" />
        <p className="text-sm">No slots available for this day</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
      {slots.map((slot) => {
        const isSelected = selectedSlot && slot.time.getTime() === selectedSlot.getTime();
        const isUserLocked = userLockedSlot && slot.time.getTime() === userLockedSlot.getTime();
        const isLockedByOther = slot.locked && slot.available;
        const isBooked = !slot.available && !slot.locked;
        const isUnavailable = (isLockedByOther || isBooked) && !isUserLocked;

        const formattedTime = format(toZonedTime(slot.time, "Africa/Johannesburg"), "HH:mm");

        return (
          <button
            key={slot.time.toISOString()}
            onClick={() => (slot.available || isUserLocked) && onSlotSelect(slot)}
            disabled={isUnavailable}
            title={isLockedByOther ? "Being reserved by another user" : isBooked ? "Already booked" : undefined}
            className={cn(
              "h-12 rounded-xl text-sm font-semibold transition-all flex flex-col items-center justify-center gap-0.5",

              // User's own reserved slot
              isUserLocked && "bg-primary text-white ring-2 ring-primary ring-offset-2",

              // Selected (not yet locked)
              !isUserLocked && isSelected && "bg-primary text-white ring-2 ring-primary ring-offset-2",

              // Available
              !isUserLocked && !isSelected && slot.available && !slot.locked &&
                "bg-card border border-border hover:border-primary hover:bg-primary/5 text-foreground cursor-pointer",

              // Locked by another user — amber icon only
              isLockedByOther && !isUserLocked &&
                "bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-500 cursor-not-allowed",

              // Fully booked
              isBooked &&
                "bg-muted text-muted-foreground cursor-not-allowed opacity-50 line-through",
            )}
          >
            <span>{formattedTime}</span>
            {isLockedByOther && !isUserLocked && (
              <Lock className="h-3 w-3" />
            )}
            {isUserLocked && (
              <Lock className="h-3 w-3 opacity-80" />
            )}
          </button>
        );
      })}
    </div>
  );
}
