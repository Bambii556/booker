import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { notifications } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { unauthorizedError, internalError } from '@/lib/api-error';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      return unauthorizedError('You must be logged in');
    }

    const rows = await db.query.notifications.findMany({
      where: eq(notifications.userId, session.user.id),
      orderBy: [desc(notifications.createdAt)],
    });

    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    return internalError('Failed to fetch notifications', error);
  }
}
