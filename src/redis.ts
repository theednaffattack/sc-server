import Redis from "ioredis";
// import redisClient from "redis";
// import path from "path";
// import fs from "fs";
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
  port: parseInt(process.env.REDIS_INTERIOR_PORT!, 10), // parseInt(process.env.REDIS_INTERIOR_PORT!, 10),
  name: "myredis",
  password: process.env.REDIS_PASS,
  retryStrategy: (times: any) => Math.max(times * 100, 3000),
  showFriendlyErrorStack: true,
  // connectTimeout: 10000,
  // tls: {
  //   ca: fs.readFileSync(path.resolve(__dirname, `../certs/fullchain.pem`)),
  //   cert: fs.readFileSync(path.resolve(__dirname, `../certs/cert.pem`)),
  //   key: fs.readFileSync(path.resolve(__dirname, `../certs/key.pem`)),
  //   servername: process.env.VIRTUAL_HOST,
  //   maxVersion: "TLSv1.2",
  //   minVersion: "TLSv1.2",
  //   // secureProtocol: "",
  //   checkServerIdentity: () => {
  //     return undefined;
  //   },
  // },
};

export function redisError(error: Error) {
  console.warn("redis error", {
    error,
    productionOptions,
    env: process.env.NODE_ENV,
    isNotProd: nodeEnvIs_NOT_Prod,
  });
}

export function redisReady(readyEvent: any) {
  console.log("redis is ready", readyEvent);
}

export const redis = nodeEnvIs_NOT_Prod
  ? new Redis(developmentOptions)
  : new Redis(productionOptions);

redis.on("error", redisError);

redis.on("ready", redisReady);

export const pubsub = new RedisPubSub({
  // ...,
  publisher: redis,
  subscriber: redis,
});
