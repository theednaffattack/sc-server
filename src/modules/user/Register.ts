import { Arg, Resolver, Query, Mutation, UseMiddleware } from "type-graphql";
import bcrypt from "bcryptjs";
import { User } from "../../entity/User";
import { RegisterInput } from "./register/RegisterInput";
import { isAuth } from "../middleware/isAuth";
import { loggerMiddleware } from "../middleware/logger";
import { sendEmail } from "../utils/sendEmail";
import { createConfirmationUrl } from "../utils/createConfirmationUrl";
import { RegisterResponse } from "../team/register-response";

@Resolver()
export class RegisterResolver {
  @UseMiddleware(isAuth, loggerMiddleware)
  @Query(() => String, { name: "helloWorld", nullable: false })
  hello() {
    return "Hello World";
  }

  @Mutation(() => RegisterResponse)
  async register(
    @Arg("data")
    { email, firstName, lastName, password, username }: RegisterInput
  ): Promise<RegisterResponse> {
    let hashedPassword;
    let user;

    try {
      hashedPassword = await bcrypt.hash(password, 12);
    } catch (error) {
      console.warn("ERROR HASHING PASSWORD", error);
    }

    try {
      user = await User.create({
        firstName,
        lastName,
        email,
        username,
        password: hashedPassword,
      }).save();
    } catch (error) {
      console.warn("ERROR CREATING USER", error);

      return {
        errors: [
          {
            field: "username",
            message: "Error creating user.",
          },
        ],
      };
    }

    try {
      if (user) {
        await sendEmail(email, await createConfirmationUrl(user.id));
      } else {
        return {
          errors: [
            {
              field: "username",
              message: "Error creating user.",
            },
          ],
        };
      }
    } catch (error) {
      console.warn("ERROR SENDING CONFIRMATION EMAIL", error);
    }

    return {
      user,
    };
  }
}
