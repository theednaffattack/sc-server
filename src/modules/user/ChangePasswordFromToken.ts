import { Resolver, Mutation, Arg, Ctx, UseMiddleware } from "type-graphql";
import bcrypt from "bcryptjs";

import { redis } from "../../redis";
import { User } from "../../entity/User";
import { forgotPasswordPrefix } from "../constants/redisPrefixes";
import { ChangePasswordInput } from "./changePassword/ChangePasswordInput";
import { MyContext } from "../../types/MyContext";
import { isAuth } from "../middleware/isAuth";
import { loggerMiddleware } from "../middleware/logger";
import { ChangePasswordResponse } from "../team/change-password-response";

@Resolver()
export class ChangePasswordFromTokenResolver {
  @UseMiddleware(isAuth, loggerMiddleware)
  @Mutation(() => ChangePasswordResponse)
  async changePasswordFromToken(
    @Arg("data")
    { token, password }: ChangePasswordInput,
    @Ctx() ctx: MyContext
  ): Promise<ChangePasswordResponse> {
    const userId = await redis.get(forgotPasswordPrefix + token);
    // token expired in redis, possibly bad token
    if (!userId) {
      return {
        errors: [
          {
            field: "password",
            message: "Change password token has expired.",
          },
        ],
      };
    }

    const user = await User.findOne(userId);

    // can't find a user in the db
    if (!user) {
      return {
        errors: [
          {
            field: "password",
            message:
              "Error changing password. Please contact your Team Administrator.",
          },
        ],
      };
    }

    // don't allow this token to be used to change
    // password again
    await redis.del(forgotPasswordPrefix + token);

    // security
    user.password = await bcrypt.hash(password, 12);

    // save updated password
    await user.save();

    // login in the user
    ctx.req.session!.userId = user.id;

    return {
      user,
    };
  }
}
