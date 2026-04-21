import { db } from './db';
import { notifications } from './db/schema';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

export type EmailPayload = {
  userId: string;
  to: string;
  subject: string;
  type: 'booking_confirmation' | 'booking_cancellation';
  data: {
    bookingReference: string;
    branchName: string;
    branchAddress: string;
    scheduledAt: Date;
  };
};

function renderBody(payload: EmailPayload): string {
  const { type, data, to } = payload;
  const zonedTime = toZonedTime(data.scheduledAt, 'Africa/Johannesburg');
  const dateStr = format(zonedTime, 'EEEE, MMMM d, yyyy');
  const timeStr = format(zonedTime, 'HH:mm');
  const endTimeStr = format(new Date(zonedTime.getTime() + 30 * 60 * 1000), 'HH:mm');

  if (type === 'booking_confirmation') {
    return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light">
    <meta name="supported-color-schemes" content="light">
    <style>
      :root { color-scheme: light only; }
      body { background-color: #ffffff !important; }
    </style>
  </head>
  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333333; background-color: #ffffff; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #ffffff; padding: 0;">

      <div style="background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%); background-color: #1d4ed8; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: #ffffff; margin: 0; font-size: 26px;">Booking Confirmed</h1>
        <p style="color: #bfdbfe; margin: 8px 0 0; font-size: 14px;">Your appointment is all set</p>
      </div>

      <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">

        <p style="color: #333333; margin: 0 0 20px;">Dear Customer,</p>
        <p style="color: #333333; margin: 0 0 24px;">Your appointment has been successfully booked. Here are your details:</p>

        <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; color: #6b7280; font-size: 13px; width: 40%;">Booking Reference</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; font-weight: bold; font-family: monospace; color: #1d4ed8;">${data.bookingReference}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; color: #6b7280; font-size: 13px;">Branch</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; color: #333333;">${data.branchName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; color: #6b7280; font-size: 13px;">Address</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; color: #333333;">${data.branchAddress}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; color: #6b7280; font-size: 13px;">Date</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; color: #333333;">${dateStr}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-size: 13px;">Time</td>
              <td style="padding: 8px 0; color: #333333;">${timeStr} – ${endTimeStr}</td>
            </tr>
          </table>
        </div>

        <div style="background-color: #eff6ff; border-left: 4px solid #1d4ed8; padding: 14px 16px; border-radius: 0 6px 6px 0; margin-bottom: 24px;">
          <p style="margin: 0; font-size: 14px; color: #1e40af;">Please arrive 5 minutes before your scheduled time. Bring a valid ID.</p>
        </div>

        <p style="color: #6b7280; font-size: 13px; margin: 0 0 4px;">To cancel or view your appointment, visit your dashboard.</p>
        <p style="color: #6b7280; font-size: 13px; margin: 0 0 24px;">This confirmation was sent to <strong>${to}</strong>.</p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
        <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">This is a simulated email from Booker. Please do not reply.</p>
      </div>

    </div>
  </body>
</html>`;
  }

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light">
    <meta name="supported-color-schemes" content="light">
    <style>
      :root { color-scheme: light only; }
      body { background-color: #ffffff !important; }
    </style>
  </head>
  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333333; background-color: #ffffff; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #ffffff; padding: 0;">

      <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); background-color: #dc2626; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: #ffffff; margin: 0; font-size: 26px;">Appointment Cancelled</h1>
        <p style="color: #fecaca; margin: 8px 0 0; font-size: 14px;">Your booking has been cancelled</p>
      </div>

      <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">

        <p style="color: #333333; margin: 0 0 20px;">Dear Customer,</p>
        <p style="color: #333333; margin: 0 0 24px;">Your appointment has been cancelled. Here is a summary:</p>

        <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; color: #6b7280; font-size: 13px; width: 40%;">Booking Reference</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; font-weight: bold; font-family: monospace; color: #dc2626;">${data.bookingReference}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; color: #6b7280; font-size: 13px;">Branch</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; color: #333333;">${data.branchName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; color: #6b7280; font-size: 13px;">Date</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; color: #333333;">${dateStr}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-size: 13px;">Time</td>
              <td style="padding: 8px 0; color: #333333;">${timeStr} – ${endTimeStr}</td>
            </tr>
          </table>
        </div>

        <p style="color: #333333; margin: 0 0 24px;">You can book a new appointment at any time from the branches page.</p>

        <p style="color: #6b7280; font-size: 13px; margin: 0 0 4px;">This cancellation notice was sent to <strong>${to}</strong>.</p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
        <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">This is a simulated email from Booker. Please do not reply.</p>
      </div>

    </div>
  </body>
</html>`;
}

export async function sendEmail(payload: EmailPayload): Promise<void> {
  const body = renderBody(payload);

  await db.insert(notifications).values({
    userId: payload.userId,
    type: payload.type,
    subject: payload.subject,
    body,
  });

  console.log('[notifications] simulated email', {
    to: payload.to,
    subject: payload.subject,
    type: payload.type,
    reference: payload.data.bookingReference,
  });
}
