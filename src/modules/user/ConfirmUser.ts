import { Arg, Resolver, Mutation } from "type-graphql";

import { redis } from "../../redis";
import { User } from "../../entity/User";
import { confirmUserPrefix } from "../constants/redisPrefixes";

@Resolver()
export class ConfirmUserResolver {
  @Mutation(() => Boolean)
  async confirmUser(
    @Arg("token") token: string
    // @Ctx() ctx: MyContext
  ): Promise<boolean> {
    const userId = await redis.get(confirmUserPrefix + token);

    console.log("userId", userId);
    console.log("TOKEN AND PREFIX", confirmUserPrefix + token);
    if (!userId) {
      return false;
    }

    await User.update({ id: userId }, { confirmed: true });
    await redis.del(token);

    return true;
  }
}
