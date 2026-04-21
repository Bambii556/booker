'use client';

import { useState, useMemo } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isBefore, isAfter, getDay, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './button';
import { isWeekend } from '@/lib/slots';

interface DatePickerProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  minDate?: Date;
  maxDaysAhead?: number;
}

export function DatePicker({
  selectedDate,
  onDateSelect,
  minDate = new Date(),
  maxDaysAhead = 30,
}: DatePickerProps) {
  const today = new Date();
  const maxDate = addDays(minDate, maxDaysAhead);
  
  const [viewMonth, setViewMonth] = useState(startOfMonth(today));

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(viewMonth);
    const monthEnd = endOfMonth(viewMonth);
    
    const startDayOfWeek = getDay(monthStart);
    const mondayOffset = startDayOfWeek === 0 ? -6 : 1 - startDayOfWeek;
    const calendarStart = addDays(monthStart, mondayOffset);

    const endDayOfWeek = getDay(monthEnd);
    const calendarEnd = endDayOfWeek === 0 ? monthEnd : addDays(monthEnd, 7 - endDayOfWeek - 1);

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [viewMonth]);

  const weeks = useMemo(() => {
    const result: Date[][] = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      result.push(calendarDays.slice(i, i + 7));
    }
    return result;
  }, [calendarDays]);

  const handlePrevMonth = () => {
    setViewMonth(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setViewMonth(prev => addMonths(prev, 1));
  };

  const canGoPrev = !isBefore(startOfMonth(viewMonth), startOfMonth(minDate));
  const canGoNext = isBefore(endOfMonth(viewMonth), maxDate);

  const isDateAvailable = (date: Date): boolean => {
    const isPast = isBefore(date, minDate);
    const isBeyondMax = isAfter(date, maxDate);
    const isBlocked = isWeekend(date);
    return !isPast && !isBeyondMax && !isBlocked;
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrevMonth}
          disabled={!canGoPrev}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-lg font-semibold">
          {format(viewMonth, 'MMMM yyyy')}
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={handleNextMonth}
          disabled={!canGoNext}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
          <div
            key={day}
            className="text-xs font-medium text-muted-foreground py-2"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {weeks.flat().map(day => {
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isAvailable = isDateAvailable(day);
          const isCurrentMonth = isSameMonth(day, viewMonth);
          const isToday = isSameDay(day, today);

          return (
            <button
              key={day.toISOString()}
              onClick={() => isAvailable && onDateSelect(day)}
              disabled={!isAvailable}
              className={`
                h-10 w-full rounded-lg text-sm font-medium transition-colors
                ${!isCurrentMonth ? 'text-muted-foreground/40' : ''}
                ${isAvailable
                  ? 'cursor-pointer hover:bg-muted'
                  : 'text-muted-foreground/40 cursor-not-allowed'
                }
                ${isSelected ? 'bg-primary text-primary-foreground' : ''}
                ${isToday && !isSelected ? 'ring-1 ring-border' : ''}
              `}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}