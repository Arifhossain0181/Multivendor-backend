// src/config/redis.ts
// ioredis client singleton used by:
//   - rate-limit-redis  (rate limiting store)
//   - any future caching layer

// import Redis from "ioredis";
// import { env } from "./env";

// export const redis = new Redis(env.REDIS_URL, {
//   maxRetriesPerRequest: 3,
//   enableReadyCheck: true,
//   lazyConnect: true,
// });

// redis.on("connect", () => console.log("  Redis connected"));
// redis.on("error", (err :any) => console.error(" Redis error:", err.message));