import {
  Arg,
  Resolver,
  Mutation,
  Ctx,
  UseMiddleware,
  Query,
} from "type-graphql";
import bcrypt from "bcryptjs";

import { User } from "../../entity/User";
import { MyContext } from "../../types/MyContext";
import { loggerMiddleware } from "../middleware/logger";
import { LoginResponse } from "../team/login-response";
import { sendRefreshToken } from "../../lib/lib.send-refresh-token";
import { createAccessToken, createRefreshToken } from "../../lib/auth.jwt-auth";
import { isAuth } from "../middleware/isAuth";
import { UserToTeam } from "../../entity/UserToTeam";

@Resolver()
export class LoginResolver {
  @UseMiddleware(loggerMiddleware)
  @Mutation(() => LoginResponse)
  async login(
    @Arg("username") username: string,
    @Arg("password") password: string,
    @Ctx() ctx: MyContext
  ): Promise<LoginResponse> {
    let userToTeam: UserToTeam | undefined;
    let user: User | undefined;

    try {
      user = await User.findOne({ where: { username } });
      // if we can't find a user return an obscure result (null) to prevent fishing
      if (!user) {
        return {
          errors: [
            {
              field: "username",
              message: "Error logging in. Please try again.",
            },
          ],
        };
      }
    } catch (error) {
      console.error("ERROR FINDING USER FOR LOGIN", error);
      return { errors: [{ field: "username", message: "Login error" }] };
    }

    const valid = await bcrypt.compare(password, user.password);

    // if the supplied password is invalid return early
    if (!valid) {
      return {
        errors: [{ field: "username", message: "Invalid credentials." }],
      };
    }

    // if the user has not confirmed via email
    if (!user.confirmed) {
      return {
        errors: [
          { field: "username", message: "Please confirm your account." },
        ],
      };
    }

    console.log("CTX & USER ID", {
      ctxResExists: ctx.res ? true : false,
      userId: user.id,
    });

    // login successful
    sendRefreshToken(ctx.res, createRefreshToken(user));

    ctx.userId = user.id;

    try {
      userToTeam = await UserToTeam.findOne({ where: { id: user.id } });
      ctx.userTeam = userToTeam;
    } catch (error) {
      console.error("ERROR SELECTING USER / TEAM MERGE RECORD", error);
      return { errors: [{ field: "username", message: "Login error" }] };
    }

    return {
      accessToken: createAccessToken(user),
      user,
    };

    //   // all is well return the user we found
    //   ctx.req.session!.userId = user.id;
    //   ctx.userId = user.id;
    //   return {
    //     user: user,
    //   };
  }

  @Query(() => String)
  @UseMiddleware(isAuth)
  bye(@Ctx() { payload }: MyContext) {
    return `your user id is: ${payload!.token?.userId}`;
  }
}
