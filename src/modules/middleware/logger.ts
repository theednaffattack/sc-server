import { MiddlewareFn } from "type-graphql";
import { MyContext } from "../../types/MyContext";

import pino from "pino";

const logger = pino({
  prettyPrint: { forceColor: true },
});

export const loggerMiddleware: MiddlewareFn<MyContext> = async (
  { info },
  next
) => {
  const start = Date.now();
  await next();
  const resolveTime = Date.now() - start;

  logger.info({
    type: "timing",
    name: `${info.parentType.name}.${info.fieldName}`,
    ms: `${resolveTime} ms`,
  });
};
