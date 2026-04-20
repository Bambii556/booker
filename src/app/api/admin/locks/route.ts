import { NextResponse } from "next/server";
import redis from "@/lib/redis";

export async function GET() {
  try {
    const locks: Array<{
      key: string;
      branchId: string;
      slotTime: string;
      userId: string;
      ttl: number;
      ttlReadable: string;
      expiresAt: string;
    }> = [];

    const LOCK_PREFIX = "booking:lock";
    
    const cursor = "0";
    let currentCursor = cursor;
    
    do {
      const [nextCursor, keys] = await redis.scan(currentCursor, "MATCH", `${LOCK_PREFIX}:*`, "COUNT", 100);
      currentCursor = nextCursor;

      for (const key of keys) {
        const [userId, ttl] = await Promise.all([
          redis.get(key),
          redis.ttl(key),
        ]);

        if (userId && ttl > 0) {
          const parts = key.replace(`${LOCK_PREFIX}:`, "").split(":");
          const branchId = parts[0];
          const slotTime = parts.slice(1).join(":");

          locks.push({
            key,
            branchId,
            slotTime,
            userId,
            ttl,
            ttlReadable: formatTTL(ttl),
            expiresAt: new Date(Date.now() + ttl * 1000).toISOString(),
          });
        }
      }
    } while (currentCursor !== "0");

    return NextResponse.json({
      success: true,
      data: locks,
    });
  } catch (error) {
    console.error("Locks admin error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch locks" },
      { status: 500 }
    );
  }
}

function formatTTL(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}