import { db } from '../src/lib/db';
import { appointments } from '../src/lib/db/schema';
import { eq, lte, and } from 'drizzle-orm';

const ARCHIVE_AFTER_MINUTES = 30;

export async function cleanupOldAppointments() {
  const cutoffTime = new Date();
  cutoffTime.setMinutes(cutoffTime.getMinutes() - ARCHIVE_AFTER_MINUTES);

  const archived = await db
    .update(appointments)
    .set({
      status: 'archived',
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(appointments.status, 'confirmed'),
        lte(appointments.scheduledAt, cutoffTime)
      )
    )
    .returning({ id: appointments.id });

  console.log(`[cleanup] archived ${archived.length} appointment(s)`);
  return archived.length;
}