'use client';

import { format, addMinutes } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import {
  MapPin, Calendar, Clock, Check, X,
  Download, Mail, MessageSquare, CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ConfirmationCardProps {
  bookingReference: string;
  branchName: string;
  branchAddress: string;
  scheduledAt: Date;
  updatedAt?: Date | null;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'archived';
  userEmail: string;
  isProcessing: boolean;
}

const STATUS_CONFIG = {
  confirmed: {
    icon: <CheckCircle2 className="h-6 w-6 text-green-600" />,
    label: 'Confirmed',
    pill: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    banner: null,
  },
  completed: {
    icon: <Check className="h-6 w-6 text-muted-foreground" />,
    label: 'Completed',
    pill: 'bg-muted text-muted-foreground',
    banner: null,
  },
  cancelled: {
    icon: <X className="h-6 w-6 text-red-500" />,
    label: 'Cancelled',
    pill: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    banner: 'cancelled',
  },
  archived: {
    icon: <X className="h-6 w-6 text-red-500" />,
    label: 'Archived',
    pill: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    banner: 'archived',
  },
  pending: {
    icon: <Clock className="h-6 w-6 text-yellow-500" />,
    label: 'Pending',
    pill: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    banner: null,
  },
};

export function ConfirmationCard({
  bookingReference,
  branchName,
  branchAddress,
  scheduledAt,
  updatedAt,
  status,
  userEmail,
  isProcessing,
}: ConfirmationCardProps) {
  const zonedTime = toZonedTime(scheduledAt, 'Africa/Johannesburg');
  const endTime = addMinutes(zonedTime, 30);
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;

  const generateICS = () => {
    const startDate = format(zonedTime, "yyyyMMdd'T'HHmmss");
    const endDate = format(endTime, "yyyyMMdd'T'HHmmss");
    const now = format(new Date(), "yyyyMMdd'T'HHmmss");
    const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Booker//Appointment//EN\nBEGIN:VEVENT\nUID:${bookingReference}@booker.app\nDTSTAMP:${now}\nDTSTART:${startDate}\nDTEND:${endDate}\nSUMMARY:Appointment at ${branchName}\nDESCRIPTION:Booking Reference: ${bookingReference}\nLOCATION:${branchAddress}\nSTATUS:CONFIRMED\nEND:VEVENT\nEND:VCALENDAR`;
    const blob = new Blob([ics], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${bookingReference}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">

      {/* Status header */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
              status === 'confirmed' ? 'bg-green-100 dark:bg-green-900/30' :
              status === 'completed' ? 'bg-muted' :
              status === 'cancelled' || status === 'archived' ? 'bg-red-100 dark:bg-red-900/30' :
              'bg-yellow-100 dark:bg-yellow-900/30'
            }`}>
              {isProcessing ? <Clock className="h-5 w-5 animate-spin text-muted-foreground" /> : config.icon}
            </div>
            <div>
              <p className="font-bold text-lg leading-tight">
                {isProcessing ? 'Processing…' : `Appointment ${config.label}`}
              </p>
              <p className="text-xs font-mono text-muted-foreground mt-0.5">{bookingReference}</p>
            </div>
          </div>
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${config.pill}`}>
            {config.label}
          </span>
        </div>

        {/* Appointment details */}
        <div className="bg-muted/40 rounded-xl p-4 space-y-3">
          <div className="flex items-start gap-3">
            <MapPin className="h-4 w-4 text-primary/60 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-sm">{branchName}</p>
              <p className="text-sm text-muted-foreground">{branchAddress}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-primary/60 shrink-0" />
            <p className="text-sm font-medium">{format(zonedTime, 'EEEE, MMMM d, yyyy')}</p>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="h-4 w-4 text-primary/60 shrink-0" />
            <p className="text-sm font-medium">{format(zonedTime, 'HH:mm')} – {format(endTime, 'HH:mm')}</p>
          </div>
        </div>

        {/* Cancelled / archived banner */}
        {(status === 'cancelled' || status === 'archived') && (
          <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
              <X className="h-4 w-4 shrink-0" />
              <p className="text-sm font-medium">
                {status === 'cancelled' ? 'This appointment was cancelled' : 'This appointment has been archived'}
                {updatedAt && ` on ${format(toZonedTime(updatedAt, 'Africa/Johannesburg'), 'MMM d, yyyy \'at\' HH:mm')}`}.
              </p>
            </div>
          </div>
        )}

        {/* Completed banner */}
        {status === 'completed' && (
          <div className="mt-4 bg-muted border border-border rounded-xl p-4 flex items-center gap-2 text-muted-foreground">
            <Check className="h-4 w-4 shrink-0" />
            <p className="text-sm">This appointment has been completed.</p>
          </div>
        )}
      </div>

      {/* Actions for confirmed */}
      {status === 'confirmed' && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <Button onClick={generateICS} variant="outline" className="w-full gap-2">
            <Download className="h-4 w-4" />
            Add to Calendar
          </Button>

          <div className="border-t border-border pt-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Notifications</p>
            <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <Mail className="h-4 w-4 shrink-0" />
              <span>Confirmation sent to <span className="font-medium text-foreground">{userEmail}</span></span>
            </div>
            <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <MessageSquare className="h-4 w-4 shrink-0" />
              <span>View in <a href="/profile?tab=notifications" className="text-primary hover:underline">Profile → Notifications</a></span>
            </div>
          </div>
        </div>
      )}

      {/* Nav buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button variant="outline" className="w-full" onClick={() => window.location.href = '/dashboard'}>
          My Appointments
        </Button>
        <Button className="w-full" onClick={() => window.location.href = '/branches'}>
          Book Another
        </Button>
      </div>

    </div>
  );
}
