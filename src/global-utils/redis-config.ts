import { RedisPubSub } from "graphql-redis-subscriptions";
import Redis from "ioredis";

const options = {
  host: process.env.REDIS_DOMAIN_NAME,
  port: parseInt(process.env.REDIS_PORT_NUMBER!),
  retryStrategy: (times: any) => {
    // reconnect after
    return Math.min(times * 50, 2000);
  }
};

export const pubsub = new RedisPubSub({
  // ...,
  publisher: new Redis(options),
  subscriber: new Redis(options)
});
