import { db } from '@/lib/db';
import { appointments } from '@/lib/db/schema';
import { eq, lte, and } from 'drizzle-orm';

const ARCHIVE_AFTER_MINUTES = 30;

export async function cleanupOldAppointments() {
  const cutoffTime = new Date();
  cutoffTime.setMinutes(cutoffTime.getMinutes() - ARCHIVE_AFTER_MINUTES);

  const result = await db
    .update(appointments)
    .set({
      status: 'archived',
      archivedAt: new Date(),
    })
    .where(
      and(
        eq(appointments.status, 'confirmed'),
        lte(appointments.scheduledAt, cutoffTime)
      )
    );

  return result;
}