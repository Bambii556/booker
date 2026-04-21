import { db } from '../src/lib/db';
import { appointments } from '../src/lib/db/schema';
import { eq, lte, and } from 'drizzle-orm';

export async function completeAppointments() {
  const now = new Date();

  const completed = await db
    .update(appointments)
    .set({
      status: 'completed',
      updatedAt: now,
    })
    .where(
      and(
        eq(appointments.status, 'confirmed'),
        lte(appointments.scheduledAt, now)
      )
    )
    .returning({ id: appointments.id });

  console.log(`[complete-appointments] marked ${completed.length} appointment(s) as completed`);
  return completed.length;
}
