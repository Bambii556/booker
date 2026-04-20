import { format, parse, addMinutes, startOfDay, setHours, setMinutes, isSameDay } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import type { Slot, BranchWithAvailability } from '@/types';

const SA_TIMEZONE = 'Africa/Johannesburg';

export function parseTimeString(timeStr: string): { hours: number; minutes: number } {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return { hours, minutes };
}

export function toSATime(date: Date): Date {
  return toZonedTime(date, SA_TIMEZONE);
}

export function fromSATime(date: Date): Date {
  return fromZonedTime(date, SA_TIMEZONE);
}

export function formatSlotTime(date: Date): string {
  const zonedDate = toZonedTime(date, SA_TIMEZONE);
  return format(zonedDate, 'HH:mm');
}

export function formatDisplayDate(date: Date): string {
  return format(date, 'EEEE, MMMM d, yyyy');
}

export function generateSlots(
  branch: BranchWithAvailability,
  date: Date,
  bookedTimes: Date[]
): Slot[] {
  const dayOfWeek = date.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return [];
  }

  const open = parseTimeString(branch.openingTime);
  const close = parseTimeString(branch.closingTime);

  const dayStart = startOfDay(date);
  const slotStart = setMinutes(setHours(dayStart, open.hours), open.minutes);
  const slotEnd = setMinutes(setHours(dayStart, close.hours), close.minutes);

  const slots: Slot[] = [];
  let current = slotStart;

  while (current < slotEnd) {
    const slotTimeUTC = fromZonedTime(current, SA_TIMEZONE);
    
    const isBooked = bookedTimes.some(booked => {
      const bookedUTC = booked instanceof Date ? booked : new Date(booked);
      return Math.abs(bookedUTC.getTime() - slotTimeUTC.getTime()) < 1000 * 60;
    });

    slots.push({
      time: slotTimeUTC,
      available: !isBooked,
    });

    current = addMinutes(current, 30);
  }

  return slots;
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

export function isWithinBookingWindow(date: Date, daysAhead: number = 30): boolean {
  const today = startOfDay(new Date());
  const maxDate = addMinutes(addMinutes(today, daysAhead * 24 * 60), -1);
  return date >= today && date <= maxDate;
}
