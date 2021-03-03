import { MiddlewareFn } from "type-graphql";
import { verify } from "jsonwebtoken";

import { MyContext } from "../../types/MyContext";

export const isAuth: MiddlewareFn<MyContext> = async ({ context }, next) => {
  // Cookie implementation
  // if (!context.req.session!.userId && !context.userId) {
  //   throw new Error("Not authenticated");
  // }

  // JWT implementation
  const authorization = context.req.headers["authorization"];

  if (!authorization) {
    console.log("AUTHORIZATION HEADER MISSING", context.req.headers);

    throw new Error("Not authenticated");
  }

  try {
    const token = authorization.split(" ")[1];
    const payload = verify(token, process.env.ACCESS_TOKEN_SECRET!);
    context.payload = payload as any;
    // console.log("VIEW PAYLOAD", payload);
  } catch (err) {
    console.log("IS AUTH ERROR", err);
    throw new Error("Not authenticated");
  }

  return next();
};
