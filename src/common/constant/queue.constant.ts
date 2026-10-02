import { config } from ".";

export const connectionInfo = {
    host: config.redis.host,
    port: Number(config.redis.port),
    password: config.redis.password,
    maxRetriesPerRequest: null, // REQUIRED for BullMQ
    retryStrategy(times: number) {
        return Math.min(times * 50, 2000);
    }
}