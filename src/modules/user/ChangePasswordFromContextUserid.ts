import { Resolver, Mutation, Arg, Ctx, UseMiddleware } from "type-graphql";
import bcrypt from "bcryptjs";

import { User } from "../../entity/User";
// import { ChangePasswordInput } from "./changePassword/ChangePasswordInput";
import { MyContext } from "../../types/MyContext";
import { isAuth } from "../middleware/isAuth";
import { loggerMiddleware } from "../middleware/logger";
import { PasswordInput } from "../shared/PasswordInput";
import { createAccessToken } from "../../lib/auth.jwt-auth";

@Resolver()
export class ChangePasswordFromContextUseridResolver {
  @UseMiddleware(isAuth, loggerMiddleware)
  @Mutation(() => User, { nullable: true })
  async changePasswordFromContextUserid(
    @Arg("data")
    { password }: PasswordInput,
    @Ctx() { req, userId, ...restCtx }: MyContext
  ): Promise<User | null> {
    if (!userId) {
      return null;
    }

    const user = await User.findOne(userId);

    // can't find a user in the db
    if (!user) {
      return null;
    }

    // security
    user.password = await bcrypt.hash(password, 12);

    // save updated password
    await user.save();

    const what = createAccessToken(user);
    console.log("WHAT THE HELL", what);

    // login in the user
    restCtx.payload = { token: { userId: user.id, iat: 0, exp: 0 } };
    // req.session!.userId = user.id;

    return user;
  }
}
