import redis from './redis';

const LOCK_PREFIX = 'booking:lock';
const USER_LOCK_PREFIX = 'booking:user-lock';
const LOCK_TTL_SECONDS = 300; // 5 minutes default

function getLockKey(branchId: string, slotTime: Date): string {
  return `${LOCK_PREFIX}:${branchId}:${slotTime.toISOString()}`;
}

function getUserLockKey(userId: string): string {
  return `${USER_LOCK_PREFIX}:${userId}`;
}

export interface LockInfo {
  locked: boolean;
  userId?: string;
  ttl?: number;
  expiresAt?: Date;
}

export interface UserLockData {
  branchId: string;
  slotTime: string;
}

export async function acquireLock(
  branchId: string,
  slotTime: Date,
  userId: string,
  ttlSeconds: number = LOCK_TTL_SECONDS
): Promise<boolean> {
  const userKey = getUserLockKey(userId);
  const slotKey = getLockKey(branchId, slotTime);

  // Enforce one-lock-per-user: release any prior lock for a different slot
  const existingRaw = await redis.get(userKey);
  if (existingRaw) {
    try {
      const existing: UserLockData = JSON.parse(existingRaw);
      const isSameSlot =
        existing.branchId === branchId &&
        existing.slotTime === slotTime.toISOString();
      if (!isSameSlot) {
        await redis.del(getLockKey(existing.branchId, new Date(existing.slotTime)));
      }
    } catch {
      // malformed value — ignore, will be overwritten below
    }
  }

  // Atomic slot claim
  const result = await redis.set(slotKey, userId, 'EX', ttlSeconds, 'NX');
  if (result !== 'OK') {
    return false;
  }

  // Update user-lock index (always overwrite, same TTL)
  await redis.set(
    userKey,
    JSON.stringify({ branchId, slotTime: slotTime.toISOString() }),
    'EX',
    ttlSeconds,
  );

  return true;
}

export async function releaseLock(
  branchId: string,
  slotTime: Date,
  userId?: string,
): Promise<boolean> {
  const slotKey = getLockKey(branchId, slotTime);
  const result = await redis.del(slotKey);
  if (userId) {
    await redis.del(getUserLockKey(userId));
  }
  return result > 0;
}

export async function getLockInfo(branchId: string, slotTime: Date): Promise<LockInfo> {
  const key = getLockKey(branchId, slotTime);

  const [userId, ttl] = await Promise.all([
    redis.get(key),
    redis.ttl(key),
  ]);

  if (!userId) {
    return { locked: false };
  }

  const ttlSeconds = ttl > 0 ? ttl : 0;
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

  return {
    locked: true,
    userId,
    ttl: ttlSeconds,
    expiresAt,
  };
}

export async function checkLock(branchId: string, slotTime: Date): Promise<boolean> {
  const key = getLockKey(branchId, slotTime);
  const exists = await redis.exists(key);
  return exists === 1;
}

export async function getUserLock(userId: string): Promise<UserLockData | null> {
  const raw = await redis.get(getUserLockKey(userId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserLockData;
  } catch {
    return null;
  }
}

export async function renewLock(
  branchId: string,
  slotTime: Date,
  userId: string,
  ttlSeconds: number = LOCK_TTL_SECONDS
): Promise<boolean> {
  const key = getLockKey(branchId, slotTime);

  const currentUserId = await redis.get(key);
  if (currentUserId !== userId) {
    return false;
  }

  const result = await redis.expire(key, ttlSeconds);
  if (result === 1) {
    await redis.expire(getUserLockKey(userId), ttlSeconds);
  }
  return result === 1;
}

export async function getLockTTL(branchId: string, slotTime: Date): Promise<number> {
  const key = getLockKey(branchId, slotTime);
  const ttl = await redis.ttl(key);
  return ttl > 0 ? ttl : 0;
}
