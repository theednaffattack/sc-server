import Redis from "ioredis";
import path from "path";
import fs from "fs";
import { RedisPubSub } from "graphql-redis-subscriptions";

const nodeEnvIs_NOT_Prod = process.env.NODE_ENV !== "production";

const developmentOptions: Redis.RedisOptions = {
  host: "localhost",
  port: 6379,
  retryStrategy: (times: any) => Math.max(times * 100, 3000),
  showFriendlyErrorStack: true,
};

const productionOptions: Redis.RedisOptions = {
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_INTERIOR_PORT!, 10),
  name: "myredis",
  password: process.env.REDIS_PASS!,
  retryStrategy: (times: any) => Math.max(times * 100, 3000),
  showFriendlyErrorStack: true,
  tls: {
    ca: fs.readFileSync(path.resolve(__dirname, `../certs/fullchain.pem`)),
    cert: fs.readFileSync(path.resolve(__dirname, `../certs/cert.pem`)),
    key: fs.readFileSync(path.resolve(__dirname, `../certs/key.pem`)),
    host: process.env.VIRTUAL_HOST,
  },
};
export function redisError(error: Error) {
  console.warn("error", error);
}
export const redis = nodeEnvIs_NOT_Prod
  ? new Redis(developmentOptions)
  : new Redis(productionOptions);

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
