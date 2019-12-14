import { Resolver, Mutation, Arg, Ctx, UseMiddleware } from "type-graphql";
import bcrypt from "bcryptjs";

import { redis } from "../../redis";
import { User } from "../../entity/User";
import { forgotPasswordPrefix } from "../constants/redisPrefixes";
import { ChangePasswordInput } from "./changePassword/ChangePasswordInput";
import { MyContext } from "src/types/MyContext";
import { isAuth } from "../middleware/isAuth";
import { loggerMiddleware } from "../middleware/logger";

@Resolver()
export class ChangePasswordResolver {
  @UseMiddleware(isAuth, loggerMiddleware)
  @Mutation(() => User, { nullable: true })
  async changePassword(
    @Arg("data")
    { token, password }: ChangePasswordInput,
    @Ctx() ctx: MyContext
  ): Promise<User | null> {
    const userId = await redis.get(forgotPasswordPrefix + token);
    console.log(token);
    console.log(userId);
    // token expired in redis, possibly bad token
    if (!userId) {
      return null;
    }

    const user = await User.findOne(userId);

    // can't find a user in the db
    if (!user) {
      return null;
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

    return user;
  }
}
