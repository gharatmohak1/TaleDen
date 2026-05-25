import redis from "@/lib/redis";

interface RateLimitOptions {
  key: string;
  limit: number;
  windowSecs: number;
}

export async function rateLimit({ key, limit, windowSecs }: RateLimitOptions) {
  try {
    const current = await redis.incr(key);
    if (current === 1) await redis.expire(key, windowSecs);
    if (current > limit) {
      const ttl = await redis.ttl(key);
      return { allowed: false as const, retryAfter: ttl };
    }
    return { allowed: true as const };
  } catch {
    return { allowed: true as const };
  }
}
