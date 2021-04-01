import { Resolver, Mutation, Ctx, UseMiddleware } from "type-graphql";
import { MyContext } from "../../types/MyContext";
// import { sendRefreshToken } from "../../lib/lib.send-refresh-token";
import { loggerMiddleware } from "../middleware/logger";

@Resolver()
export class LogoutResolver {
  @UseMiddleware(loggerMiddleware)
  @Mutation(() => Boolean)
  async logout(
    @Ctx()
    ctx: MyContext
  ): Promise<Boolean> {
    return new Promise((resolve) => {
      // sendRefreshToken(ctx.res, "");

      ctx.res.clearCookie(process.env.COOKIE_NAME!);
      ctx.res.clearCookie("CloudFront-Key-Pair-Id");
      ctx.res.clearCookie("CloudFront-Policy");
      ctx.res.clearCookie("CloudFront-Signature");

      return resolve(true);

      // return ctx.req.session!.destroy((err) => {
      //   if (err) {
      //     console.error(err);
      //     return reject(false);
      //   }

      //   sendRefreshToken(ctx.res, "");
      //   console.log("CLEARING COOKIE", process.env.COOKIE_NAME!);
      //   console.log(
      //     "CLEARING COOKIE",
      //     ctx.req.cookies[process.env.COOKIE_NAME!]
      //   );

      //   ctx.res.clearCookie(process.env.COOKIE_NAME!);

      //   return resolve(true);
      // });
    });
  }
}
