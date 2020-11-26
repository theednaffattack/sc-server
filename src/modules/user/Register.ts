import { Arg, Resolver, Query, Mutation, UseMiddleware } from "type-graphql";
import bcrypt from "bcryptjs";
import { User } from "../../entity/User";
import { RegisterInput } from "./register/RegisterInput";
import { isAuth } from "../middleware/isAuth";
import { loggerMiddleware } from "../middleware/logger";
import { sendEmail } from "../utils/sendEmail";
import { createConfirmationUrl } from "../utils/createConfirmationUrl";

@Resolver()
export class RegisterResolver {
  @UseMiddleware(isAuth, loggerMiddleware)
  @Query(() => String, { name: "helloWorld", nullable: false })
  async hello() {
    return await "Hello World";
  }

  @Mutation(() => User)
  async register(
    @Arg("data")
    { email, firstName, lastName, password, username }: RegisterInput
  ): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      firstName,
      lastName,
      email,
      username,
      password: hashedPassword,
    }).save();

    await sendEmail(email, await createConfirmationUrl(user.id));
    return user;
  }
}
