import { Resolver, Mutation, Arg } from "type-graphql";
import { v4 } from "uuid";
import internalIp from "internal-ip";

import { redis } from "../../redis";
import { User } from "../../entity/User";
import { sendEmail } from "../utils/sendEmail";
import { forgotPasswordPrefix } from "../constants/redisPrefixes";

@Resolver()
export class ForgotPasswordResolver {
  @Mutation(() => Boolean)
  async forgotPassword(@Arg("email") email: string): Promise<boolean> {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return true;
    }

    const token = v4();

    const homeIp = internalIp.v4.sync();

    const nodeEnvIsProd = process.env.NODE_ENV === "production";

    try {
      await redis.set(
        forgotPasswordPrefix + token,
        user.id,
        "ex",
        60 * 60 * 24
      ); // 1 day expiration
    } catch (error) {
      console.error("redis token error", error);
    }

    if (nodeEnvIsProd) {
      try {
        await sendEmail(
          email,
          `https://${process.env.FRONT_END_PROTO_AND_DOMAIN_PROD}:${process.env.INTERNAL_API_PORT}/change-password/${token}`
        );
      } catch (error) {
        console.error("Forgot password - send email error", error);
      }
    } else {
      try {
        await sendEmail(
          email,
          `http://${homeIp}:${process.env.INTERNAL_API_PORT}/change-password/${token}`
        );
      } catch (error) {
        console.error("Forgot password - send email error", error);
      }
    }

    return true;
  }
}
