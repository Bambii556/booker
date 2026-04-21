import { NextRequest, NextResponse } from 'next/server';
import { notFoundError, internalError } from '@/lib/api-error';
import { getJob } from '../../../../../../jobs/config';
import { runJob } from '../../../../../../jobs/runner';

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

    await runJob(job, 'manual');

    return NextResponse.json({ success: true, message: `Job "${job.label}" completed` });
  } catch (error) {
    return internalError('Job execution failed', error);
  }
}
