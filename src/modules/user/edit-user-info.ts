import { Arg, Resolver, Mutation, UseMiddleware, Ctx } from "type-graphql";

import { User } from "../../entity/User";
import { EditUserInput } from "./register/edit-user-input";
import { isAuth } from "../middleware/isAuth";
import { loggerMiddleware } from "../middleware/logger";
import { MyContext } from "../../types/MyContext";

let errorMessageBase = "Error saving info to database";

@Resolver()
export class EditUserInfoResolver {
  @UseMiddleware(isAuth, loggerMiddleware)
  @Mutation(() => User)
  async editUserInfo(
    @Arg("data")
    { email, firstName, lastName }: EditUserInput,
    @Ctx() ctx: MyContext
  ): Promise<any> {
    // most efficient way to set records in the DB
    // returns nothing
    await User.createQueryBuilder()
      .update(User)
      .set({ email, firstName, lastName })
      .where("id = :id", { id: ctx.userId })
      .execute()
      .then(data => console.log(data))
      .catch(error => console.error(error));

    // since an error is thrown above on errors
    // it may be smarter to return the data passed in via
    // arguments rather than perform a lookup
    let userToReturn = await User.createQueryBuilder()
      .where("id = :id", { id: ctx.userId })
      .getOne()
      .catch(error => {
        console.error(error);
        throw Error(`${errorMessageBase}\n${error}`);
      });

    console.log({ userToReturn });

    return userToReturn;
  }
}
