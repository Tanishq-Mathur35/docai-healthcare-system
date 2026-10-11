import { Redis } from '@upstash/redis';
import { env } from './env';

// Helper to parse any Upstash or Redis connection URL
function parseUpstashConfig(redisUrl: string, redisPassword?: string): { url: string; token: string } {
  if (!redisUrl) {
    return { url: '', token: '' };
  }

  // Format 1: rediss://default:<TOKEN>@<HOST>:6379 or redis://...
  if (redisUrl.startsWith('rediss://') || redisUrl.startsWith('redis://')) {
    try {
      const parsed = new URL(redisUrl);
      const token = decodeURIComponent(parsed.password || parsed.username || redisPassword || '');
      const host = parsed.hostname;
      return {
        url: `https://${host}`,
        token,
      };
    } catch {
      // fallback
    }
  }

  // Format 2: https://default:<TOKEN>@<HOST> or https://<HOST>
  if (redisUrl.startsWith('https://') || redisUrl.startsWith('http://')) {
    try {
      const parsed = new URL(redisUrl);
      const token = decodeURIComponent(
        parsed.password || (parsed.username !== 'default' ? parsed.username : '') || redisPassword || ''
      );
      return {
        url: `${parsed.protocol}//${parsed.host}`,
        token,
      };
    } catch {
      // fallback
    }
  }

  return {
    url: redisUrl,
    token: redisPassword || '',
  };
}

const { url, token } = parseUpstashConfig(env.REDIS_URL, env.REDIS_PASSWORD);

// Initialize Upstash Redis client via REST API
export const redis = new Redis({
  url: url || 'https://localhost',
  token: token || 'token',
});

// Polyfill quit method for graceful shutdown compatibility in src/index.ts
(redis as any).quit = async () => Promise.resolve('OK');

export async function connectRedis(): Promise<void> {
  try {
    if (url && token && !url.includes('localhost')) {
      const pong = await redis.ping();
      console.log('✅ Upstash Redis connected:', pong);
    } else {
      console.log('ℹ️ Upstash Redis configured via REDIS_URL');
    }
  } catch (err) {
    console.warn('⚠️ Upstash Redis connection check:', (err as Error).message);
  }
}

// Refresh token helpers using Upstash Redis
export const RefreshTokenStore = {
  async set(userId: string, tokenHash: string, ttlSeconds: number): Promise<void> {
    await redis.set(`refresh:${userId}:${tokenHash}`, '1', { ex: ttlSeconds });
  },

  async exists(userId: string, tokenHash: string): Promise<boolean> {
    const result = await redis.exists(`refresh:${userId}:${tokenHash}`);
    return result === 1;
  },

  async delete(userId: string, tokenHash: string): Promise<void> {
    await redis.del(`refresh:${userId}:${tokenHash}`);
  },

  async deleteAll(userId: string): Promise<void> {
    const keys = await redis.keys(`refresh:${userId}:*`);
    if (keys && keys.length > 0) {
      await redis.del(...keys);
    }
  },
};
