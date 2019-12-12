import { Resolver, Mutation, Ctx } from "type-graphql";
import { MyContext } from "../../types/MyContext";

@Resolver()
export class LogoutResolver {
  @Mutation(() => Boolean)
  async logout(
    @Ctx()
    ctx: MyContext
  ): Promise<Boolean> {
    return new Promise((resolve, reject) => {
      return ctx.req.session!.destroy(err => {
        if (err) {
          console.error(err);
          return reject(false);
        }

        ctx.res.clearCookie("scg");

        return resolve(true);
      });
    });
  }
}
