import internalIp from "internal-ip";
import { redis } from "../../redis";
import { inviteUserPrefix } from "../constants/redisPrefixes";

export const createInvitationUrl = async (userId: string): Promise<string> => {
  const nodeEnv = process.env.NODE_ENV;

  if (process.env.TEST_CLIENT_ORIGIN && nodeEnv === "test") {
    const client = process.env.TEST_CLIENT_ORIGIN;
    try {
      await redis.set(inviteUserPrefix + userId, userId, "ex", 60 * 60 * 24); // 1 day expiration
    } catch (error) {
      throw Error(error);
    }
    return `${client}/invitation/${userId}`;
  }

  if (process.env.INTERNAL_API_PORT && nodeEnv === "development") {
    const port = process.env.INTERNAL_API_PORT;
    const client = internalIp.v4() + ":" + port;
    try {
      await redis.set(inviteUserPrefix + userId, userId, "ex", 60 * 60 * 24); // 1 day expiration
    } catch (error) {
      throw Error(error);
    }
    return `${client}/invitation/${userId}`;
  }

  if (process.env.PRODUCTION_CLIENT_ORIGIN && nodeEnv === "production") {
    const client = process.env.PRODUCTION_CLIENT_ORIGIN;
    try {
      await redis.set(inviteUserPrefix + userId, userId, "ex", 60 * 60 * 24); // 1 day expiration
    } catch (error) {
      throw Error(error);
    }
    return `${client}/invitation/${userId}`;
  }

  console.log("WHY AM I GETTING THIS ERROR CONF URL DOMAIN IN INVITATION URL", {
    devOrigin: internalIp.v4() + ":" + process.env.INTERNAL_API_PORT,
    internalPort: process.env.INTERNAL_API_PORT,
    nodeEnv,
  });

  throw Error("Cannot detect confirmation URL domain.");
};
