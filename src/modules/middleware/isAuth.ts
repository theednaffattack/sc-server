import { MiddlewareFn } from "type-graphql";
import { MyContext } from "../../types/MyContext";

export const isAuth: MiddlewareFn<MyContext> = async ({ context }, next) => {
  // Cookie implementation
  // if (!context.req.session!.userId && !context.userId) {
  //   throw new Error("Not authenticated");
  // }

  if (context.payload?.errors && context.payload.errors.length > 0) {
    const expiredErrors = context.payload.errors.filter(
      ({ name }) => name === "TokenExpiredError"
    );

    if (expiredErrors && expiredErrors.length > 0) {
      throw new Error(`Your session has expired, please log in.`);
    } else {
      throw new Error(
        `Not authenticated - ${context.payload.errors[0].message}`
      );
    }
  }

  if (!context.payload?.token?.userId) {
    throw new Error("Not authenticated");
  }
  return next();
};
