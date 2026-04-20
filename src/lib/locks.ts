import redis from './redis';

const LOCK_PREFIX = 'booking:lock';
const LOCK_TTL_SECONDS = 300; // 5 minutes default

function getLockKey(branchId: string, slotTime: Date): string {
  const timeStr = slotTime.toISOString();
  return `${LOCK_PREFIX}:${branchId}:${timeStr}`;
}

export interface LockInfo {
  locked: boolean;
  userId?: string;
  ttl?: number;
  expiresAt?: Date;
}

export async function acquireLock(
  branchId: string,
  slotTime: Date,
  userId: string,
  ttlSeconds: number = LOCK_TTL_SECONDS
): Promise<boolean> {
  const key = getLockKey(branchId, slotTime);
  
  // SET NX with TTL - atomic operation
  const result = await redis.set(key, userId, 'EX', ttlSeconds, 'NX');
  
  return result === 'OK';
}

export async function releaseLock(branchId: string, slotTime: Date): Promise<boolean> {
  const key = getLockKey(branchId, slotTime);
  const result = await redis.del(key);
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

export async function renewLock(
  branchId: string,
  slotTime: Date,
  userId: string,
  ttlSeconds: number = LOCK_TTL_SECONDS
): Promise<boolean> {
  const key = getLockKey(branchId, slotTime);
  
  // Only renew if the lock belongs to this user
  const currentUserId = await redis.get(key);
  if (currentUserId !== userId) {
    return false;
  }
  
  const result = await redis.expire(key, ttlSeconds);
  return result === 1;
}

export async function getLockTTL(branchId: string, slotTime: Date): Promise<number> {
  const key = getLockKey(branchId, slotTime);
  const ttl = await redis.ttl(key);
  return ttl > 0 ? ttl : 0;
}