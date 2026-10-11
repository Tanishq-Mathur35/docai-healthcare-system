import rateLimit from 'express-rate-limit';
import { redis } from '../config/redis';
import { env } from '../config/env';

// Custom Upstash Redis Store for express-rate-limit
class UpstashRateLimitStore {
  prefix: string;
  windowMs: number;

  constructor(prefix = 'rl:', windowMs = 60000) {
    this.prefix = prefix;
    this.windowMs = windowMs;
  }

  init(options: { windowMs: number }) {
    this.windowMs = options.windowMs;
  }

  async increment(key: string) {
    const redisKey = `${this.prefix}${key}`;
    try {
      const hits = await redis.incr(redisKey);
      if (hits === 1) {
        await redis.pexpire(redisKey, this.windowMs);
      }
      const ttl = (await redis.pttl(redisKey)) || this.windowMs;
      const resetTime = new Date(Date.now() + Math.max(0, ttl));
      return { totalHits: hits, resetTime };
    } catch {
      // In case of network error, allow request through gracefully
      return { totalHits: 1, resetTime: new Date(Date.now() + this.windowMs) };
    }
  }

  async decrement(key: string) {
    try {
      await redis.decr(`${this.prefix}${key}`);
    } catch {
      // ignore
    }
  }

  async resetKey(key: string) {
    try {
      await redis.del(`${this.prefix}${key}`);
    } catch {
      // ignore
    }
  }
}

export const globalRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  store: new UpstashRateLimitStore('rl:global:', env.RATE_LIMIT_WINDOW_MS),
  message: { success: false, message: 'Too many requests, please try again later.' },
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: new UpstashRateLimitStore('rl:auth:', 15 * 60 * 1000),
  message: { success: false, message: 'Too many auth attempts, please try again in 15 minutes.' },
});
