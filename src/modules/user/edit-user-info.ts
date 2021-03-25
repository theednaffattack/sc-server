import {
  Arg,
  Authorized,
  Ctx,
  Field,
  Mutation,
  ObjectType,
  Resolver,
  UseMiddleware,
} from "type-graphql";
import { TeamRoleEnum } from "../../entity/Role";
import { User } from "../../entity/User";
import { UserToTeam } from "../../entity/UserToTeam";
import { FieldError } from "../../lib/gql-type.field-error";
import { MyContext } from "../../types/MyContext";
import { isAuth } from "../middleware/isAuth";
import { loggerMiddleware } from "../middleware/logger";
import { EditUserInput } from "./register/edit-user-input";

let errorMessageBase = "Error saving info to database";

@ObjectType()
class UserExtendedWithTeamRoles {
  @Field(() => User, { nullable: false })
  user: User;

  @Field(() => [TeamRoleEnum], { nullable: false })
  teamRoles: TeamRoleEnum[];
}

@ObjectType()
export class EditUserInfoResponse {
  @Field(() => FieldError, { nullable: true })
  errors?: FieldError[];

  @Field(() => UserExtendedWithTeamRoles, { nullable: true })
  userWithRoles?: UserExtendedWithTeamRoles;
}

@Resolver()
export class EditCurrentUserInfoResolver {
  @UseMiddleware(isAuth, loggerMiddleware)
  @Authorized("ADMIN", "OWNER")
  @Mutation(() => EditUserInfoResponse)
  async editCurrentUserInfo(
    @Arg("data")
    { email, firstName, lastName, teamRoles }: EditUserInput,
    @Ctx() ctx: MyContext
  ): Promise<EditUserInfoResponse> {
    // most efficient way to set records in the DB
    // returns nothing
    let setObject = {
      email,
      firstName,
      lastName,
    };

    await User.createQueryBuilder()
      .update(User)
      .set(setObject)
      .where("id = :id", { id: ctx.payload?.token?.userId })
      .execute()
      .then((data) => console.log("TYPICAL UPDATE", data))
      .catch((error) => console.error(error));

    let userToCheckAttributes = await UserToTeam.createQueryBuilder("utt")
      .where("utt.userId = :id", { id: ctx.payload?.token?.userId })
      .getOne()
      .catch((error) => {
        console.error(error);
        throw Error(`${errorMessageBase}\n${error}`);
      });

    // ENUM TO ARRAY
    // adapted from: https://github.com/microsoft/TypeScript/issues/31268#issuecomment-489660702
    const realTeamRoles = userToCheckAttributes?.teamRoleAuthorizations.includes(
      TeamRoleEnum.OWNER
    )
      ? [
          ...Object.values(teamRoles!).filter((k) => typeof k === "string"),
          TeamRoleEnum.OWNER,
        ]
      : teamRoles;

    await UserToTeam.createQueryBuilder()
      .update(UserToTeam)
      .where({ userId: userToCheckAttributes?.userId })
      .set({
        teamRoleAuthorizations: realTeamRoles,
      })
      .execute()
      .then((data) => {
        console.log("UPDATE USER TO TEAM MERGE TABLE", {
          data,
          userId: ctx.payload?.token?.userId,
        });
      })
      .catch((error) => {
        console.error(error);
      });

    // since an error is thrown above on errors
    // it may be smarter to return the data passed in via
    // arguments rather than perform a lookup
    let userToReturn = await User.createQueryBuilder("user")
      .where("user.id = :id", { id: ctx.payload?.token?.userId })
      .getOne()
      .catch((error) => {
        console.error(error);
        throw Error(`${errorMessageBase}\n${error}`);
      });

    if (!userToReturn) {
      return {
        errors: [
          {
            field: "username",
            message: "There was an error updating your info.",
          },
        ],
      };
    }

    return {
      userWithRoles: {
        teamRoles: realTeamRoles ?? [],
        user: userToReturn,
      },
    };
  }
}
