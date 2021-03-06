import internalIp from "internal-ip";
import { redis } from "../../redis";
import { confirmUserPrefix } from "../constants/redisPrefixes";

export const createConfirmationUrl = async (
  userId: string
): Promise<string> => {
  const nodeEnv = process.env.NODE_ENV;

  if (process.env.TEST_CLIENT_ORIGIN && nodeEnv === "test") {
    const client = process.env.TEST_CLIENT_ORIGIN;
    try {
      await redis.set(confirmUserPrefix + userId, userId, "ex", 60 * 60 * 24); // 1 day expiration
    } catch (error) {
      throw Error(error);
    }
    return `${client}/confirmation/${userId}`;
  }

  if (
    process.env.PRODUCTION_CLIENT_ORIGIN &&
    process.env.INTERNAL_API_PORT &&
    nodeEnv === "development"
  ) {
    const port = process.env.DEV_CLIENT_PORT;
    const client = (await internalIp.v4()) + ":" + port;
    try {
      await redis.set(confirmUserPrefix + userId, userId, "ex", 60 * 60 * 24); // 1 day expiration
    } catch (error) {
      throw Error(error);
    }
    return `http://${client}/confirmation/${userId}`;
  }

  if (process.env.PRODUCTION_CLIENT_ORIGIN && nodeEnv === "production") {
    const client = process.env.PRODUCTION_CLIENT_ORIGIN;
    try {
      await redis.set(confirmUserPrefix + userId, userId, "ex", 60 * 60 * 24); // 1 day expiration
    } catch (error) {
      throw Error(error);
    }
    return `${client}/confirmation/${userId}`;
  }

  throw Error("Cannot detect confirmation URL domain.");
};
