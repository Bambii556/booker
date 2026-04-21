'use client';

import { format, addMinutes } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { MapPin, Calendar, Clock, Check, Loader2, Mail, MessageSquare, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ConfirmationCardProps {
  bookingReference: string;
  branchName: string;
  branchAddress: string;
  scheduledAt: Date;
  status: 'pending' | 'confirmed' | 'cancelled' | 'archived';
  userEmail: string;
  isProcessing: boolean;
}

export function ConfirmationCard({
  bookingReference,
  branchName,
  branchAddress,
  scheduledAt,
  status,
  userEmail,
  isProcessing,
}: ConfirmationCardProps) {
  const zonedTime = toZonedTime(scheduledAt, 'Africa/Johannesburg');
  const endTime = addMinutes(zonedTime, 30);

  const generateICS = () => {
    const startDate = format(zonedTime, "yyyyMMdd'T'HHmmss");
    const endDate = format(endTime, "yyyyMMdd'T'HHmmss");
    const now = format(new Date(), "yyyyMMdd'T'HHmmss");
    
    const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Booker//Appointment//EN
BEGIN:VEVENT
UID:${bookingReference}@booker.app
DTSTAMP:${now}
DTSTART:${startDate}
DTEND:${endDate}
SUMMARY:Appointment at ${branchName}
DESCRIPTION:Booking Reference: ${bookingReference}
LOCATION:${branchAddress}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([ics], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${bookingReference}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-muted100 dark:bg-muted800 flex items-center justify-center">
          {isProcessing ? (
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          ) : status === 'confirmed' ? (
            <Check className="h-8 w-8 text-green-600" />
          ) : (
            <Loader2 className="h-8 w-8 animate-spin text-yellow-600" />
          )}
        </div>
        <CardTitle className="text-2xl">
          {isProcessing
            ? 'Processing Your Booking...'
            : status === 'confirmed'
              ? 'Appointment Confirmed!'
              : 'Booking Pending'}
        </CardTitle>
        <p className="text-sm text-muted-foreground font-mono mt-2">
          Reference: {bookingReference}
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="bg-muted50 dark:bg-muted900 rounded-lg p-4 space-y-3">
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium">{branchName}</p>
              <p className="text-sm text-muted-foreground dark:text-muted-foreground">{branchAddress}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <p className="font-medium">{format(zonedTime, 'EEEE, MMMM d, yyyy')}</p>
          </div>

          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <p className="font-medium">
              {format(zonedTime, 'HH:mm')} - {format(endTime, 'HH:mm')}
            </p>
          </div>
        </div>

        {status === 'pending' && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
              <Loader2 className="h-5 w-5 animate-spin" />
              <p className="font-medium">Confirming your appointment...</p>
            </div>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              This usually takes a few seconds. Please don&apos;t close this page.
            </p>
          </div>
        )}

        {status === 'confirmed' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <Check className="h-5 w-5" />
              <p className="font-medium">Your appointment is confirmed!</p>
            </div>

            <Button onClick={generateICS} variant="outline" className="w-full gap-2">
              <Download className="h-4 w-4" />
              Add to Calendar
            </Button>
          </div>
        )}

        <div className="border-t border-muted200 dark:border-muted800 pt-4">
          <h4 className="font-medium mb-3 text-sm text-muted-foreground dark:text-muted-foreground uppercase tracking-wide">
            Notifications Sent
          </h4>
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground dark:text-muted-foreground">
                Confirmation email sent to <span className="font-medium text-muted900 dark:text-muted200">{userEmail}</span>
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground dark:text-muted-foreground">
                SMS reminder will be sent 24 hours before
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => window.location.href = '/dashboard'}
          >
            View All Appointments
          </Button>
          <Button
            className="w-full gap-2"
            onClick={() => window.location.href = '/branches'}
          >
            Book Another
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
