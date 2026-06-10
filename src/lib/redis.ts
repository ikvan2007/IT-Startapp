import Redis from 'ioredis'

export const redis = new Redis(process.env.REDIS_URL!, {
  tls: process.env.REDIS_URL?.startsWith('rediss://') ? {} : undefined,
})