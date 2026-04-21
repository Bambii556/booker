import { db } from '@/lib/db';
import { jobRuns } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { internalError } from '@/lib/api-error';
import { JOB_DEFINITIONS } from '../../../../../jobs/config';

export async function GET() {
  try {
    const runs = await db.query.jobRuns.findMany({
      orderBy: [desc(jobRuns.startedAt)],
      limit: 200,
    });

    const jobs = JOB_DEFINITIONS.map((job) => {
      const jobRunHistory = runs.filter((r) => r.jobName === job.name);
      const lastRun = jobRunHistory[0] ?? null;

      return {
        name: job.name,
        label: job.label,
        schedule: job.schedule,
        lastRun,
        recentRuns: jobRunHistory.slice(0, 5),
      };
    });

    return NextResponse.json({ success: true, data: jobs });
  } catch (error) {
    return internalError('Failed to fetch jobs', error);
  }
}
