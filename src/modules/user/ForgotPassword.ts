import { Resolver, Mutation, Arg } from "type-graphql";
import { v4 } from "uuid";
import internalIp from "internal-ip";

import { redis } from "../../redis";
import { User } from "../../entity/User";
import { sendEtherealEmail } from "../utils/sendEtherealEmail";
import { forgotPasswordPrefix } from "../constants/redisPrefixes";
import { sendPostmarkEmail } from "../../lib/util.send-postmark-email";

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
      const uri = `https://${process.env.PRODUCTION_CLIENT_ORIGIN}:${process.env.INTERNAL_API_PORT}/change-password/${token}`;
      try {
        await sendPostmarkEmail(email, uri);
      } catch (error) {
        console.error("Forgot password - send email error", error);
      }
    } else {
      const uri = `http://${homeIp}:${process.env.INTERNAL_API_PORT}/change-password/${token}`;
      try {
        await sendEtherealEmail(email, uri);
      } catch (error) {
        console.error("Forgot password - send email error", error);
      }
    }

    return true;
  }
}
