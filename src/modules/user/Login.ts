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
import AWS from "aws-sdk";
import internalIp from "internal-ip";

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

    const cfPublicKeyId = process.env.CF_PUBLIC_KEY_ID;
    const cfPrivateKey = process.env.CF_PRIVATE_KEY;

    const cfDomain = process.env.CLOUDFRONT_DOMAIN;

    const frontendDomain =
      process.env.NODE_ENV === "development"
        ? internalIp.v4.sync()
        : process.env.COOKIE_DOMAIN;

    if (cfPublicKeyId && cfPrivateKey && cfDomain && frontendDomain) {
      // Create signed cookie for private content
      const CFSigner = new AWS.CloudFront.Signer(cfPublicKeyId, cfPrivateKey);

      // 2 days as milliseconds to use for link expiration
      const twoDays = 2 * 24 * 60 * 60 * 1000;

      const expireTime = Math.floor((Date.now() + twoDays) / 1000);

      const policy = JSON.stringify({
        Statement: [
          {
            Resource: `https://${cfDomain}/images/*`,
            Condition: {
              DateLessThan: {
                "AWS:EpochTime": expireTime,
              },
            },
          },
        ],
      });

      // Set Cookies after successful verification
      const cookie = CFSigner.getSignedCookie({
        policy,
      });

      if (cookie) {
        ctx.res.cookie(
          "CloudFront-Key-Pair-Id",
          cookie["CloudFront-Key-Pair-Id"],
          {
            domain: frontendDomain,
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24 * 7,
            path: "/",
            secure: process.env.NODE_ENV === "production" ? true : false,
          }
        );

        ctx.res.cookie("CloudFront-Policy", cookie["CloudFront-Policy"], {
          httpOnly: true,
          domain: frontendDomain,
          maxAge: 1000 * 60 * 60 * 24 * 7,
          path: "/",
          secure: process.env.NODE_ENV === "production" ? true : false,
        });

        ctx.res.cookie("CloudFront-Signature", cookie["CloudFront-Signature"], {
          httpOnly: true,
          domain: frontendDomain,
          maxAge: 1000 * 60 * 60 * 24 * 7,
          path: "/",
          secure: process.env.NODE_ENV === "production" ? true : false,
        });
      }
    } else {
      console.error(
        `Cannot access remote resource necessary for login. Please check your environment variables`
      );
      return {
        errors: [
          {
            field: "username",
            message: "Login error",
          },
        ],
      };
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
