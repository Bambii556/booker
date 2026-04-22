import { NextRequest, NextResponse } from 'next/server';
import { notFoundError, internalError } from '@/lib/api-error';
import { getJob } from '../../../../../../jobs/config';
import boss from '@/lib/pgboss';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ name: string }> },
) {
  try {
    const { name } = await params;
    const job = getJob(name);

    if (!job) {
      return notFoundError(`Job "${name}" not found`);
    }

    await boss.start();
    const jobId = await boss.send(name, { triggeredBy: 'manual' }, { priority: 10 });

    return NextResponse.json({ success: true, message: `Job "${job.label}" queued`, jobId });
  } catch (error) {
    return internalError('Job execution failed', error);
  }
}
