import { Resolver, Query, Ctx, UseMiddleware } from "type-graphql";

import { User } from "../../entity/User";
import { MyContext } from "../../types/MyContext";
import { loggerMiddleware } from "../middleware/logger";
import { isAuth } from "../middleware/isAuth";
import { MeResponse } from "./me/me-response";

@Resolver()
export class MeResolver {
  @UseMiddleware(isAuth, loggerMiddleware)
  @Query(() => MeResponse, { nullable: true })
  async me(@Ctx() ctx: MyContext): Promise<MeResponse> {
    // if we can't find a payload or userId on the current context

    if (ctx.payload?.errors && ctx.payload.errors.length > 0) {
      return {
        errors: [
          {
            field: "general-user-facing",
            message: `Auth error - ${ctx.payload.errors[0].message}`,
          },
        ],
      };
    }

    if (!ctx.payload?.token?.userId) {
      return {
        errors: [
          {
            field: "general-user-facing",
            message: `Auth error - not authenticated`,
          },
        ],
      };
    }

    let user;
    try {
      user = await User.findOne(ctx.payload.token?.userId);
    } catch (error) {
      return {
        errors: [
          {
            field: "general-user-facing",
            message: `Error fetching user - ${error.message}`,
          },
        ],
      };
    }
    if (user) {
      return { user };
    } else {
      return {
        errors: [
          {
            field: "general-user-facing-error",
            message: "Unexpected error",
          },
        ],
      };
    }
  }
}
