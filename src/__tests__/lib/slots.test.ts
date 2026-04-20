import { describe, it, expect } from 'vitest';
import { generateSlots, parseTimeString, isWeekend, isWithinBookingWindow } from '@/lib/slots';
import type { BranchWithAvailability } from '@/types';

const mockBranch: BranchWithAvailability = {
  id: '1',
  name: 'Sandton Main Branch',
  address: '123 Sandton Drive',
  openingTime: '08:00',
  closingTime: '17:00',
  timezone: 'Africa/Johannesburg',
};

describe('slots', () => {
  describe('parseTimeString', () => {
    it('parses time string correctly', () => {
      expect(parseTimeString('08:00')).toEqual({ hours: 8, minutes: 0 });
      expect(parseTimeString('14:30')).toEqual({ hours: 14, minutes: 30 });
      expect(parseTimeString('09:15')).toEqual({ hours: 9, minutes: 15 });
    });
  });

  describe('isWeekend', () => {
    it('returns true for Saturday', () => {
      const saturday = new Date('2024-06-15T12:00:00Z');
      expect(isWeekend(saturday)).toBe(true);
    });

    it('returns true for Sunday', () => {
      const sunday = new Date('2024-06-16T12:00:00Z');
      expect(isWeekend(sunday)).toBe(true);
    });

    it('returns false for weekday', () => {
      const wednesday = new Date('2024-06-12T12:00:00Z');
      expect(isWeekend(wednesday)).toBe(false);
    });
  });

  describe('isWithinBookingWindow', () => {
    it('returns true for today within window', () => {
      const today = new Date();
      expect(isWithinBookingWindow(today, 30)).toBe(true);
    });

    it('returns true for date within 30 days', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 15);
      expect(isWithinBookingWindow(futureDate, 30)).toBe(true);
    });

    it('returns false for date beyond window', () => {
      const farFutureDate = new Date();
      farFutureDate.setDate(farFutureDate.getDate() + 60);
      expect(isWithinBookingWindow(farFutureDate, 30)).toBe(false);
    });
  });

  describe('generateSlots', () => {
    it('returns empty array for weekend', () => {
      const saturday = new Date('2024-06-15T12:00:00Z');
      const slots = generateSlots(mockBranch, saturday, []);
      expect(slots).toHaveLength(0);
    });

    it('generates correct number of slots for a weekday', () => {
      const wednesday = new Date('2024-06-12T12:00:00Z');
      const slots = generateSlots(mockBranch, wednesday, []);
      expect(slots.length).toBeGreaterThan(0);
      expect(slots[0].available).toBe(true);
    });

    it('marks booked times as unavailable', () => {
      const wednesday = new Date('2024-06-12T08:00:00Z');
      const bookedTimes = [new Date('2024-06-12T09:00:00Z')];
      const slots = generateSlots(mockBranch, wednesday, bookedTimes);
      const bookedSlot = slots.find(slot =>
        Math.abs(slot.time.getTime() - bookedTimes[0].getTime()) < 1000 * 60
      );
      expect(bookedSlot?.available).toBe(false);
    });

    it('generates 30-minute interval slots', () => {
      const wednesday = new Date('2024-06-12T12:00:00Z');
      const slots = generateSlots(mockBranch, wednesday, []);

      for (let i = 1; i < slots.length; i++) {
        const diff = (slots[i].time.getTime() - slots[i - 1].time.getTime()) / (1000 * 60);
        expect(diff).toBe(30);
      }
    });
  });
});