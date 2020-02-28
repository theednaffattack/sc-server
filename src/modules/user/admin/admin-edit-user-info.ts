import { Arg, Resolver, Mutation, UseMiddleware, Ctx } from "type-graphql";
import { inspect } from "util";

import { User, UserClassTypeWithReferenceIds } from "../../../entity/User";
import { EditUserInput } from "../register/edit-user-input";
import { isAuth } from "../../middleware/isAuth";
import { loggerMiddleware } from "../../middleware/logger";
import { MyContext } from "../../../types/MyContext";
// import { Role } from "../../../entity/Role";
import { Team } from "../../../entity/Team";
import { UserToTeam } from "../../../entity/UserToTeam";

import { UserToTeamIdReferencesOnlyClass } from "../../team/team-resolver";

let errorMessageBase = "Error saving info to database";

export type UserLikeType = Omit<User, "userToTeams"> & {
  userToTeams: UserToTeamIdReferencesOnlyClass[];
};

@Resolver()
export class AdminEditUserInfoResolver {
  @UseMiddleware(isAuth, loggerMiddleware)
  @Mutation(() => UserClassTypeWithReferenceIds)
  async adminEditUserInfo(
    @Arg("data")
    { email, firstName, lastName, teamId, teamRoles }: EditUserInput,
    @Ctx() ctx: MyContext
  ): Promise<UserLikeType> {
    // const myTeamId = `f1b8f931-8bcc-471d-b6c3-db67acfda29a`;
    let makeAUser: UserLikeType;

    console.log("ARGS TO START WITH", {
      email,
      firstName,
      lastName,
      teamId,
      teamRoles
    });

    console.log("WHY UNDEFINED teamRoles", teamRoles);

    // most efficient way to set records in the DB
    // returns nothing
    let setBasicInfoObject = {
      email,
      firstName,
      lastName
    };

    let getUser = await User.createQueryBuilder("user")
      .select()
      .leftJoinAndSelect("user.userToTeams", "userToTeams")
      .where("id = :id", { id: ctx.userId })
      .getMany()
      .catch(error => {
        console.error(`${error}`);
      });

    if (getUser && getUser.length > 1) {
      await User.createQueryBuilder()
        .update(User)
        .set(setBasicInfoObject)
        .where("id = :id", { id: ctx.userId })
        .execute()
        .then(data => console.log("ADMIN UPDATE", data))
        .catch(error => console.error(error));

      if (teamRoles && teamRoles.length > 0) {
        // let newTeamRolesArray = teamRoles.map(role => TeamRoleEnum[role]);

        // console.log("newTeamRolesArray: ".toUpperCase(), newTeamRolesArray);

        let createRole = await UserToTeam.createQueryBuilder("userToTeam")
          .insert()
          .into(UserToTeam)
          .values({
            userId: ctx.userId,
            teamId: teamId,
            teamRoleAuthorizations: teamRoles
          })
          .execute();

        const [loadManually] = await Team.createQueryBuilder("utt")
          .relation("team", "userToTeams")
          .of(ctx.userId) // you can use just post id as well
          .loadMany();

        const [loadUserManually]: UserToTeam[] = await User.createQueryBuilder(
          "user"
        )
          .relation("user", "userToTeams")
          .of(teamId)
          .loadMany();

        console.log(
          "CREATE ROLE",
          inspect(
            {
              createRole: createRole.raw[0].userToTeamId,
              loadManually,
              loadUserManually
            },
            false,
            4,
            true
          )
        );

        let userToReturn = await User.createQueryBuilder("user")
          .select()
          .leftJoinAndSelect("user.userToTeams", "utt")
          // .leftJoinAndSelect("utt.team", "team")
          .where("user.id = :id", { id: ctx.userId })
          .getOne()
          .catch(error => {
            console.error(error);
            throw Error(`${errorMessageBase}\n${error}`);
          });

        if (userToReturn) {
          makeAUser = Object.assign({}, userToReturn, {
            userToTeams: [loadUserManually]
          });

          console.log(
            "USER TO RETURN",
            inspect(
              {
                userToReturn: userToReturn,
                makeAUser
              },
              false,
              4,
              true
            )
          );
          return makeAUser;
        }
      }

      let userToReturn = await User.createQueryBuilder("user")
        .select()
        .leftJoinAndSelect("user.userToTeams", "userToTeams")
        .leftJoinAndSelect("userToTeams.team", "team")
        .where("user.id = :id", { id: ctx.userId })
        .getOne()
        .catch(error => {
          console.error(error);
          throw Error(`${errorMessageBase}\n${error}`);
        });

      makeAUser = Object.assign({}, userToReturn, {
        userToTeams: []
      });

      console.log("USER TO RETURN OUTSIDE IF", {
        userToReturn: userToReturn
      });
      return makeAUser;
    }
    throw Error("No User info to edit");
  }
}
