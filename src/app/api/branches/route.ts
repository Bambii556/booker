import { db } from '@/lib/db';
import { branches } from '@/lib/db/schema';
import { asc, ilike, or, count } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = (page - 1) * limit;

    const searchPattern = search ? `%${search}%` : null;

    const whereClause = searchPattern
      ? or(
          ilike(branches.name, searchPattern),
          ilike(branches.address, searchPattern)
        )
      : undefined;

    const [branchesList, totalResult] = await Promise.all([
      db.query.branches.findMany({
        where: whereClause,
        orderBy: [asc(branches.name)],
        limit,
        offset,
      }),
      db
        .select({ count: count() })
        .from(branches)
        .where(whereClause),
    ]);

    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: {
        branches: branchesList,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching branches:', error);
    return NextResponse.json(
      { success: false, error: 'FETCH_ERROR', message: 'Failed to fetch branches' },
      { status: 500 }
    );
  }
}
