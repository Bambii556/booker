import { NextRequest, NextResponse } from "next/server";
import redis from "@/lib/redis";

export async function GET() {
  try {
    type RedisKey = { key: string; type: string; value: string | null; ttl: number | null; ttlReadable: string | null };
  const keys: RedisKey[] = [];
    
    const cursor = "0";
    const [, batch] = await redis.scan(cursor, "MATCH", "*", "COUNT", 100);
    
    for (const key of batch) {
      const type = await redis.type(key);
      let value: string | null = null;
      
      if (type === "string") {
        value = await redis.get(key);
      } else if (type === "list") {
        const len = await redis.llen(key);
        value = `[list with ${len} items]`;
      } else if (type === "set") {
        const members = await redis.smembers(key);
        value = `[set with ${members.length} items]: ${members.join(", ")}`;
      } else if (type === "zset") {
        const count = await redis.zcard(key);
        value = `[sorted set with ${count} items]`;
      } else if (type === "hash") {
        const fields = await redis.hgetall(key);
        value = JSON.stringify(fields);
      } else if (type === "none") {
        value = "[key does not exist]";
      }
      
      const ttl = await redis.ttl(key);
      
      keys.push({
        key,
        type,
        value,
        ttl: ttl > 0 ? ttl : null,
        ttlReadable: ttl > 0 ? formatTTL(ttl) : null,
      });
    }
    
    return NextResponse.json({
      success: true,
      data: keys,
    });
  } catch (error) {
    console.error("Redis admin error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch Redis keys" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");
    
    if (!key) {
      return NextResponse.json(
        { success: false, message: "Key is required" },
        { status: 400 }
      );
    }
    
    const result = await redis.del(key);
    
    return NextResponse.json({
      success: true,
      deleted: result > 0,
    });
  } catch (error) {
    console.error("Redis delete error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete key" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { key, ttl } = await request.json();
    
    if (!key) {
      return NextResponse.json(
        { success: false, message: "Key is required" },
        { status: 400 }
      );
    }
    
    if (ttl) {
      await redis.expire(key, ttl);
    }
    
    const type = await redis.type(key);
    let value: string | null = null;
    
    if (type === "string") {
      value = await redis.get(key);
    }
    
    return NextResponse.json({
      success: true,
      data: {
        key,
        type,
        value,
        ttl: await redis.ttl(key),
      },
    });
  } catch (error) {
    console.error("Redis refresh error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to refresh key" },
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