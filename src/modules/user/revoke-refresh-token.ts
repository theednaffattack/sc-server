import { Arg, Int, Mutation, Resolver } from "type-graphql";
import { getConnection } from "typeorm";

import { User } from "../../entity/User";

@Resolver()
export class RevokeRefreshTokensForUserResolver {
  @Mutation(() => Boolean)
  async revokeRefreshTokensForUser(@Arg("userId", () => Int) userId: string) {
    await getConnection()
      .getRepository(User)
      .increment({ id: userId }, "tokenVersion", 1);

    return true;
  }
}
