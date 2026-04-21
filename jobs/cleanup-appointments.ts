import { db } from '../src/lib/db';
import { appointments } from '../src/lib/db/schema';
import { eq, lte, and } from 'drizzle-orm';

const ARCHIVE_AFTER_MONTHS = 6;

export async function cleanupOldAppointments() {
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - ARCHIVE_AFTER_MONTHS);

  const archived = await db
    .update(appointments)
    .set({
      status: 'archived',
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(appointments.status, 'completed'),
        lte(appointments.scheduledAt, cutoffDate)
      )
    )
    .returning({ id: appointments.id });

  console.log(`[cleanup-appointments] archived ${archived.length} appointment(s) older than ${ARCHIVE_AFTER_MONTHS} months`);
  return archived.length;
}
