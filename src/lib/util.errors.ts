import { createError } from "apollo-errors";

enum CustomErrorType {
  AuthorizationError = "AuthorizationError",
}

export const nodeEnvIsUndefined = (functionName: string): string =>
  `The NODE_ENV var is undefined. The "${functionName}" expects to receive NODE_ENV as an argument.  Please set your environment variable "NODE_ENV" to "development", "production" or "test" and try again.`;

export const errorSavingInfoToDatabase = (
  functionName?: string,
  error?: unknown | string
): string =>
  `${functionName} experienced an error while saving your information to the database.\n${error}`;

export const AuthorizationError = createError("AuthorizationError", {
  message: "You are not authorized.",
});

export function createAuthorizationError({
  message = "You are not authorized",
}) {
  return createError(CustomErrorType.AuthorizationError, { message });
}
