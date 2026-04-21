import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { notifications } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { unauthorizedError, notFoundError, internalError } from '@/lib/api-error';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      return unauthorizedError('You must be logged in');
    }

    const { id } = await params;

    const notification = await db.query.notifications.findFirst({
      where: and(
        eq(notifications.id, id),
        eq(notifications.userId, session.user.id),
      ),
    });

    if (!notification) {
      return notFoundError('Notification not found');
    }

    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    return internalError('Failed to update notification', error);
  }
}
