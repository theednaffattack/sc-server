import { MiddlewareFn } from "type-graphql";
import { MyContext } from "../../types/MyContext";

export const isAuth: MiddlewareFn<MyContext> = async ({ context }, next) => {
  if (!context.req.session!.userId) {
    throw new Error("Not authenticated");
  }

  console.log("ISAUTH, VIEW SESSION", context.req.session);
  return next();
};
