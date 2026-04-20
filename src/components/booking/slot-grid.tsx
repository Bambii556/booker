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
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="h-14 rounded-lg bg-muted100 dark:bg-muted800 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="text-center py-8 text-muted-500 dark:text-muted-400">
        <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>No slots available for this day</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
      {slots.map((slot) => {
        const isSelected =
          selectedSlot && slot.time.getTime() === selectedSlot.getTime();
        const formattedTime = format(
          toZonedTime(slot.time, "Africa/Johannesburg"),
          "HH:mm",
        );

        const isAvailable = slot.available && !slot.locked;
        const isLocked = slot.locked && slot.available;
        const isTaken = !slot.available && !slot.locked;

        const isUserLocked =
          userLockedSlot && slot.time.getTime() === userLockedSlot.getTime();

        const isUnavailable = !isAvailable && !isUserLocked;

        return (
          <button
            key={slot.time.toISOString()}
            onClick={() => (isAvailable || isUserLocked) && onSlotSelect(slot)}
            disabled={!isAvailable && !isUserLocked}
            className={cn(
              "h-14 rounded-lg font-medium text-sm transition-all flex flex-col items-center justify-center gap-1",
              isUnavailable
                ? isLocked
                  ? "bg-amber-100 text-amber-600 dark:text-amber-400"
                  : "bg-muted100 cursor-not-allowed line-through dark:bg-muted800 dark:text-muted-600"
                : isSelected || isUserLocked
                  ? "bg-muted900 ring-2 ring-muted900 ring-offset-2 dark:bg-primary500 text-white dark:text-white"
                  : "bg-primary50 border border-blue-200 hover:bg-primary100 hover:border-blue-400 dark:bg-muted800 dark:border-muted700 dark:hover:bg-muted700",
            )}
          >
            <span>{formattedTime}</span>
            {isUnavailable && (
              <span className="text-xs opacity-75 flex items-center gap-1">
                {isLocked && <Lock className="h-3 w-3" />}
                {isLocked && "Reserved"}
              </span>
            )}
            {isUserLocked && (
              <span className="text-xs opacity-75 flex items-center gap-1">
                <Lock className="h-3 w-3" />
                Reserved
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
