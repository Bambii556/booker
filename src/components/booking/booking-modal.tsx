'use client';

import { X, Calendar, Clock, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { Button } from '@/components/ui/button';

interface BookingConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  branch: {
    name: string;
    address: string;
  };
  scheduledAt: Date;
  loading?: boolean;
}

export function BookingConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  branch,
  scheduledAt,
  loading,
}: BookingConfirmationModalProps) {
  if (!isOpen) return null;

  const zonedTime = toZonedTime(scheduledAt, 'Africa/Johannesburg');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md mx-4 bg-card rounded-xl shadow-xl p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-muted-foreground dark:hover:text-muted-foreground300"
          disabled={loading}
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-xl font-semibold mb-4">Confirm Appointment</h2>

        <div className="space-y-3 mb-6">
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium">{branch.name}</p>
              <p className="text-sm text-muted-foreground500 dark:text-muted-foreground">{branch.address}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <p className="font-medium">{format(zonedTime, 'EEEE, MMMM d, yyyy')}</p>
          </div>

          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <p className="font-medium">{format(zonedTime, 'HH:mm')} - {format(new Date(zonedTime.getTime() + 30 * 60 * 1000), 'HH:mm')}</p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={onConfirm}
            loading={loading}
          >
            {loading ? 'Securing...' : 'Confirm Booking'}
          </Button>
        </div>
      </div>
    </div>
  );
}
