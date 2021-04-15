import { nodeEnvIsUndefined } from "./util.errors";

export function getConnectionString(env: string | undefined): string {
  if (!env) {
    throw new Error(nodeEnvIsUndefined("getConnectionString"));
  }
  if (env === "test") {
    return process.env.PG_TEST_CONNECTION_STRING as string;
  }
  if (env === "production") {
    return process.env.DATABASE_URL as string;
  } else {
    return process.env.PG_DEV_CONNECTION_STRING as string;
  }
}
