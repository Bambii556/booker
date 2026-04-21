import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  acquireLock,
  releaseLock,
  getLockInfo,
  checkLock,
  getUserLock,
  renewLock,
  getLockTTL,
} from '@/lib/locks';

const mockRedis = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
  exists: vi.fn(),
  expire: vi.fn(),
  ttl: vi.fn(),
}));

vi.mock('@/lib/redis', () => ({ default: mockRedis }));

const BRANCH_ID = 'branch-1';
const USER_ID = 'user-1';
const SLOT = new Date('2024-06-12T09:00:00.000Z');
const SLOT_KEY = `booking:lock:${BRANCH_ID}:${SLOT.toISOString()}`;
const USER_KEY = `booking:user-lock:${USER_ID}`;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('acquireLock', () => {
  it('acquires a slot with no prior user lock', async () => {
    mockRedis.get.mockResolvedValue(null);
    mockRedis.set
      .mockResolvedValueOnce('OK')  // slot NX set
      .mockResolvedValueOnce('OK'); // user-lock index

    const result = await acquireLock(BRANCH_ID, SLOT, USER_ID, 300);

    expect(result).toBe(true);
    expect(mockRedis.set).toHaveBeenCalledWith(SLOT_KEY, USER_ID, 'EX', 300, 'NX');
    expect(mockRedis.set).toHaveBeenCalledWith(
      USER_KEY,
      JSON.stringify({ branchId: BRANCH_ID, slotTime: SLOT.toISOString() }),
      'EX',
      300,
    );
  });

  it('returns false when slot is already locked by another user', async () => {
    mockRedis.get.mockResolvedValue(null);
    mockRedis.set.mockResolvedValueOnce(null); // NX fails

    const result = await acquireLock(BRANCH_ID, SLOT, USER_ID, 300);

    expect(result).toBe(false);
    expect(mockRedis.set).toHaveBeenCalledTimes(1);
  });

  it('releases previous slot lock when user switches slots', async () => {
    const otherSlot = new Date('2024-06-12T10:00:00.000Z');
    const otherSlotKey = `booking:lock:${BRANCH_ID}:${otherSlot.toISOString()}`;

    mockRedis.get.mockResolvedValue(
      JSON.stringify({ branchId: BRANCH_ID, slotTime: otherSlot.toISOString() }),
    );
    mockRedis.del.mockResolvedValue(1);
    mockRedis.set
      .mockResolvedValueOnce('OK')
      .mockResolvedValueOnce('OK');

    const result = await acquireLock(BRANCH_ID, SLOT, USER_ID, 300);

    expect(result).toBe(true);
    expect(mockRedis.del).toHaveBeenCalledWith(otherSlotKey);
  });

  it('does not release prior lock when re-locking the same slot', async () => {
    mockRedis.get.mockResolvedValue(
      JSON.stringify({ branchId: BRANCH_ID, slotTime: SLOT.toISOString() }),
    );
    mockRedis.set
      .mockResolvedValueOnce('OK')
      .mockResolvedValueOnce('OK');

    await acquireLock(BRANCH_ID, SLOT, USER_ID, 300);

    expect(mockRedis.del).not.toHaveBeenCalled();
  });
});

describe('releaseLock', () => {
  it('deletes slot key and returns true when key existed', async () => {
    mockRedis.del.mockResolvedValue(1);

    const result = await releaseLock(BRANCH_ID, SLOT);

    expect(mockRedis.del).toHaveBeenCalledWith(SLOT_KEY);
    expect(result).toBe(true);
  });

  it('returns false when slot key did not exist', async () => {
    mockRedis.del.mockResolvedValue(0);

    const result = await releaseLock(BRANCH_ID, SLOT);

    expect(result).toBe(false);
  });

  it('also deletes user-lock index when userId is provided', async () => {
    mockRedis.del.mockResolvedValue(1);

    await releaseLock(BRANCH_ID, SLOT, USER_ID);

    expect(mockRedis.del).toHaveBeenCalledWith(SLOT_KEY);
    expect(mockRedis.del).toHaveBeenCalledWith(USER_KEY);
  });
});

describe('getLockInfo', () => {
  it('returns locked=false when no key exists', async () => {
    mockRedis.get.mockResolvedValue(null);
    mockRedis.ttl.mockResolvedValue(-2);

    const info = await getLockInfo(BRANCH_ID, SLOT);

    expect(info).toEqual({ locked: false });
  });

  it('returns full lock info when key exists', async () => {
    mockRedis.get.mockResolvedValue(USER_ID);
    mockRedis.ttl.mockResolvedValue(120);

    const before = Date.now();
    const info = await getLockInfo(BRANCH_ID, SLOT);
    const after = Date.now();

    expect(info.locked).toBe(true);
    expect(info.userId).toBe(USER_ID);
    expect(info.ttl).toBe(120);
    expect(info.expiresAt!.getTime()).toBeGreaterThanOrEqual(before + 120_000);
    expect(info.expiresAt!.getTime()).toBeLessThanOrEqual(after + 120_000);
  });

  it('returns ttl=0 when redis ttl is negative', async () => {
    mockRedis.get.mockResolvedValue(USER_ID);
    mockRedis.ttl.mockResolvedValue(-1);

    const info = await getLockInfo(BRANCH_ID, SLOT);

    expect(info.ttl).toBe(0);
  });
});

describe('checkLock', () => {
  it('returns true when slot key exists', async () => {
    mockRedis.exists.mockResolvedValue(1);

    expect(await checkLock(BRANCH_ID, SLOT)).toBe(true);
    expect(mockRedis.exists).toHaveBeenCalledWith(SLOT_KEY);
  });

  it('returns false when slot key does not exist', async () => {
    mockRedis.exists.mockResolvedValue(0);

    expect(await checkLock(BRANCH_ID, SLOT)).toBe(false);
  });
});

describe('getUserLock', () => {
  it('returns null when no user lock exists', async () => {
    mockRedis.get.mockResolvedValue(null);

    expect(await getUserLock(USER_ID)).toBeNull();
    expect(mockRedis.get).toHaveBeenCalledWith(USER_KEY);
  });

  it('returns parsed lock data when user lock exists', async () => {
    const payload = { branchId: BRANCH_ID, slotTime: SLOT.toISOString() };
    mockRedis.get.mockResolvedValue(JSON.stringify(payload));

    expect(await getUserLock(USER_ID)).toEqual(payload);
  });

  it('returns null when stored value is malformed JSON', async () => {
    mockRedis.get.mockResolvedValue('not-json{');

    expect(await getUserLock(USER_ID)).toBeNull();
  });
});

describe('renewLock', () => {
  it('renews both slot and user-lock keys when user matches', async () => {
    mockRedis.get.mockResolvedValue(USER_ID);
    mockRedis.expire.mockResolvedValue(1);

    const result = await renewLock(BRANCH_ID, SLOT, USER_ID, 300);

    expect(result).toBe(true);
    expect(mockRedis.expire).toHaveBeenCalledWith(SLOT_KEY, 300);
    expect(mockRedis.expire).toHaveBeenCalledWith(USER_KEY, 300);
  });

  it('returns false when slot is held by a different user', async () => {
    mockRedis.get.mockResolvedValue('other-user');

    const result = await renewLock(BRANCH_ID, SLOT, USER_ID, 300);

    expect(result).toBe(false);
    expect(mockRedis.expire).not.toHaveBeenCalled();
  });

  it('does not renew user-lock index when slot expire fails', async () => {
    mockRedis.get.mockResolvedValue(USER_ID);
    mockRedis.expire.mockResolvedValue(0);

    const result = await renewLock(BRANCH_ID, SLOT, USER_ID, 300);

    expect(result).toBe(false);
    expect(mockRedis.expire).toHaveBeenCalledTimes(1);
  });
});

describe('getLockTTL', () => {
  it('returns remaining TTL when key exists', async () => {
    mockRedis.ttl.mockResolvedValue(200);

    expect(await getLockTTL(BRANCH_ID, SLOT)).toBe(200);
    expect(mockRedis.ttl).toHaveBeenCalledWith(SLOT_KEY);
  });

  it('returns 0 when key does not exist', async () => {
    mockRedis.ttl.mockResolvedValue(-2);

    expect(await getLockTTL(BRANCH_ID, SLOT)).toBe(0);
  });
});
