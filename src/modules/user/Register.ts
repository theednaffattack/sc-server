import { Arg, Resolver, Query, Mutation, UseMiddleware } from "type-graphql";
import bcrypt from "bcryptjs";
import { User } from "../../entity/User";
import { RegisterInput } from "./register/RegisterInput";
import { isAuth } from "../middleware/isAuth";
import { loggerMiddleware } from "../middleware/logger";
import { sendEtherealEmail } from "../utils/sendEtherealEmail";
import { createConfirmationUrl } from "../utils/createConfirmationUrl";
import { RegisterResponse } from "../team/register-response";
import { sendPostmarkEmail } from "../../lib/util.send-postmark-email";

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
        team_scopes: ["no-team:guest"],
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
        const confEmail = await createConfirmationUrl(user.id);
        if (process.env.NODE_ENV === "development") {
          await sendEtherealEmail(email, confEmail);
        }
        if (process.env.NODE_ENV === "production") {
          await sendPostmarkEmail(email, confEmail);
        }
        if (process.env.NODE_ENV === "test") {
          await sendEtherealEmail(email, confEmail);
        }
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
