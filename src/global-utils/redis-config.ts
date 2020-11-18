import { RedisPubSub } from "graphql-redis-subscriptions";
import Redis from "ioredis";

const developmentOptions = {
  host: process.env.REDIS_DEV_HOST,
  port: parseInt(process.env.REDIS_PORT_NUMBER!, 10),
  retryStrategy: (times: any) => {
    // reconnect after
    return Math.min(times * 50, 2000);
  },
};

const productionOptions = {
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT_NUMBER!, 10),
  retryStrategy: (times: any) => {
    // reconnect after
    return Math.min(times * 50, 2000);
  },
};

export const pubsub = new RedisPubSub({
  // ...,
  publisher:
    process.env.NODE_ENV == "production"
      ? new Redis(productionOptions)
      : new Redis(developmentOptions),
  subscriber:
    process.env.NODE_ENV == "production"
      ? new Redis(productionOptions)
      : new Redis(developmentOptions),
});
