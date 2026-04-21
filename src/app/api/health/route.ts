import { NextResponse } from 'next/server';
import redis from '@/lib/redis';
import { db } from '@/lib/db';

type HealthStatus = 'ok' | 'degraded' | 'down';

type HealthCheck = {
  status: HealthStatus;
  latencyMs?: number;
  error?: string;
};

type HealthResponse = {
  status: HealthStatus;
  timestamp: string;
  checks: {
    database: HealthCheck;
    redis: HealthCheck;
  };
};

async function checkDatabase(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    await db.query.branches.findFirst();
    return {
      status: 'ok',
      latencyMs: Date.now() - start,
    };
  } catch (error) {
    return {
      status: 'down',
      error: error instanceof Error ? error.message : 'Database unavailable',
    };
  }
}

async function checkRedis(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    await redis.ping();
    return {
      status: 'ok',
      latencyMs: Date.now() - start,
    };
  } catch (error) {
    return {
      status: 'down',
      error: error instanceof Error ? error.message : 'Redis unavailable',
    };
  }
}

export async function GET() {
  const [dbHealth, redisHealth] = await Promise.all([
    checkDatabase(),
    checkRedis(),
  ]);

  const checks = {
    database: dbHealth,
    redis: redisHealth,
  };

  const overallStatus: HealthStatus =
    dbHealth.status === 'down' || redisHealth.status === 'down'
      ? 'down'
      : dbHealth.status === 'degraded' || redisHealth.status === 'degraded'
      ? 'degraded'
      : 'ok';

  const response: HealthResponse = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    checks,
  };

  const statusCode = overallStatus === 'ok' ? 200 : overallStatus === 'degraded' ? 200 : 503;

  return NextResponse.json(response, { status: statusCode });
}
