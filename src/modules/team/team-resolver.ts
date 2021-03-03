import {
  Resolver,
  Query,
  Mutation,
  Arg,
  ID,
  UseMiddleware,
  Ctx,
  Authorized,
  ArgsType,
  Field,
  Int,
  Args,
  ObjectType,
} from "type-graphql";
import bcrypt from "bcryptjs";
import { inspect } from "util";

import { User } from "../../entity/User";
import { Team } from "../../entity/Team";
import { exampleTeamLoader } from "../utils/data-loaders/batch-example-loader";
import { teamMemberLoader } from "../utils/data-loaders/batch-team-members-loader";
import { isAuth } from "../middleware/isAuth";
import { loggerMiddleware } from "../middleware/logger";
import { MyContext } from "../../types/MyContext";
import { TeamRoleEnum } from "../../entity/Role";
import { UserToTeam } from "../../entity/UserToTeam";
import { TeamResponse } from "./team-response";

// ADDITIONAL RESOLVERS NEEDED:
// Update team name
// Remove / Delete team
// Change / Add team owner
// Remove team member

@ArgsType()
class TeamLoginArgs {
  @Field(() => Int)
  email: string;

  @Field(() => Int)
  password: string;

  @Field()
  teamId: string;
}

export interface UserToTeamIdReferencesOnly {
  userToTeamId: string;
  userId: string;
  teamId: string;
  teamRoleAuthorizations: TeamRoleEnum[];
}

@ObjectType()
export class UserToTeamIdReferencesOnlyClass {
  @Field(() => ID, { nullable: false })
  userToTeamId: string;

  @Field(() => ID, { nullable: false })
  userId: string;

  @Field(() => ID, { nullable: false })
  teamId: string;

  @Field(() => [TeamRoleEnum], { nullable: false })
  teamRoleAuthorizations: TeamRoleEnum[];
}

type GetUserIsEmptyType =
  | "initial_value"
  | "user_is_empty"
  | "more_than_one_user_found"
  | "user_is_correctly_sized";

@Resolver()
export class UserTeamResolver {
  @UseMiddleware(isAuth, loggerMiddleware)
  @Authorized("ADMIN", "OWNER")
  @Mutation(() => UserToTeamIdReferencesOnlyClass)
  async addTeamMemberByEmail(
    @Arg("email", () => String) email: string,
    @Arg("teamId", () => String) teamId: string,
    @Arg("roles", () => [TeamRoleEnum]) roles: TeamRoleEnum[]
  ): Promise<UserToTeamIdReferencesOnly> {
    console.log("CHECK USER FETCH 1", { email, teamId, roles });

    // evaluate fetch result
    let getUserEval: GetUserIsEmptyType = "initial_value";

    // evaluate the data to make sure only one user is returned
    function evalUser(data: User[]): User[] {
      if (data.length > 1) {
        getUserEval = "more_than_one_user_found";
        throw Error(`Error: More than one user contains this email address!`);
      }
      if (data.length === 0) {
        getUserEval = "user_is_empty";
        return data;
      }
      if (data.length === 1) {
        getUserEval = "user_is_correctly_sized";
        return data;
      }
      throw Error("Nothing to return");
    }

    // check to see if we have the user in our DB
    const getUser = await User.createQueryBuilder("user")
      .where("user.email = :email", { email: email })
      .getMany()
      .then((data) => {
        return data;
      })
      .then((data) => {
        let returnData = evalUser(data)[0];
        return returnData;
      })
      .catch((err) => {
        console.log(`Error fetching User data`, { err, getUserEval });
        throw Error(err);
      });

    console.log("CHECK USER FETCH 1", { getUser, roles, getUserEval });

    let insertManually;

    insertManually = await UserToTeam.createQueryBuilder("utt")
      .insert()
      .values({
        userId: getUser.id,
        teamRoleAuthorizations: roles,
        teamId,
      })
      .execute();

    const [loadManually] = await Team.createQueryBuilder("team")
      .relation("team", "userToTeams")
      .of(getUser.id) // you can use just post id as well
      .loadMany();

    const [loadUserManually] = await User.createQueryBuilder("user")
      .relation("user", "userToTeams")
      .of(teamId)
      .loadMany();

    console.log("CHECK USER FETCH 2", {
      email,
      insertManually: insertManually?.raw,
      loadManually,
      roles,
      loadUserManually,
      // huh
    });

    return loadUserManually;
  }

  @UseMiddleware(isAuth, loggerMiddleware)
  @Authorized("ADMIN", "OWNER")
  @Mutation(() => UserToTeamIdReferencesOnlyClass)
  async addTeamMemberById(
    @Arg("userId", () => String) userId: string,
    @Arg("teamId", () => String) teamId: string,
    @Arg("roles", () => [TeamRoleEnum]) roles: TeamRoleEnum[]
  ): Promise<UserToTeamIdReferencesOnly> {
    console.log("CHECK USER FETCH 1", { userId, teamId, roles });

    // evaluate fetch result
    let getUserEval: GetUserIsEmptyType = "initial_value";

    // evaluate the data to make sure only one user is returned
    function evalUser(data: User[]): User[] {
      if (data.length > 1) {
        getUserEval = "more_than_one_user_found";
        throw Error(`Error: More than one user contains this email address!`);
      }
      if (data.length === 0) {
        getUserEval = "user_is_empty";
        return data;
      }
      if (data.length === 1) {
        getUserEval = "user_is_correctly_sized";
        return data;
      }
      throw Error("Nothing to return");
    }

    // check to see if we have the user in our DB
    const getUser = await User.createQueryBuilder("user")
      .where("user.id = :userId", { userId })
      .getMany()
      .then((data) => {
        return data;
      })
      .then((data) => {
        let returnData = evalUser(data)[0];
        return returnData;
      })
      .catch((err) => {
        console.log(`Error fetching User data`, { err, getUserEval });
        throw Error(err);
      });

    console.log("CHECK USER FETCH 1", { getUser, roles, getUserEval });

    let insertManually;

    insertManually = await UserToTeam.createQueryBuilder("utt")
      .insert()
      .values({
        userId: getUser.id,
        teamRoleAuthorizations: roles,
        teamId,
      })
      .execute();

    const [loadManually] = await Team.createQueryBuilder("team")
      .relation("team", "userToTeams")
      .of(getUser.id) // you can use just post id as well
      .loadMany();

    const [loadUserManually] = await User.createQueryBuilder("user")
      .relation("user", "userToTeams")
      .of(teamId)
      .loadMany();

    console.log("CHECK USER FETCH 2", {
      userId,
      insertManually: insertManually?.raw,
      loadManually,
      roles,
      loadUserManually,
      // huh
    });

    return loadManually;
  }

  @UseMiddleware(isAuth, loggerMiddleware)
  // @Authorized("ADMIN", "OWNER")
  @Mutation(() => TeamResponse)
  async createTeam(
    @Arg("name", () => String) name: string,
    @Ctx() { payload }: MyContext
  ): Promise<TeamResponse> {
    const userId = payload?.userId;
    if (!userId) {
      throw new Error("User ID is undefined");
    }
    if (!name || name.length < 2) {
      return {
        errors: [
          {
            field: "name",
            message: "A Team name of at least two characters is required.",
          },
        ],
      };
    }
    const unspecifiedError = "An unspecified error occurred while creating.";

    const teamResult = await Team.createQueryBuilder("team")
      .insert()
      .into("team")
      .values({ name, owner: userId })
      .execute()
      .catch((error) => {
        const catchMessage = "duplicate key value violates unique constraint";
        console.error("CHECK ERROR\n", Object.keys(error));
        console.error("CHECK ERROR\n", {
          message: error.message,
          checkStatus: error.message.includes(catchMessage),
        });
        if (error.message.includes(catchMessage)) {
          throw Error(
            "A team with this name already exists. Please try again with a unique team name."
          );
        } else {
          console.log("WHY IS THIS HAPPENING?");
          throw Error(unspecifiedError);
        }
      });

    if (teamResult && teamResult.raw) {
      const { id: teamId } = teamResult.raw[0];

      const newTeam = await Team.createQueryBuilder("team")
        .leftJoinAndSelect("team.owner", "owner")
        .where("team.id = :id", { id: teamId })
        .getOne();

      await UserToTeam.createQueryBuilder("utt")
        .insert()
        .values({
          userId,
          teamRoleAuthorizations: [TeamRoleEnum.OWNER],
          teamId: newTeam?.id,
        })
        .execute()
        .catch((error) => console.error(`${inspect(error, false, 4, true)}`));

      const uttData = await UserToTeam.createQueryBuilder("utt")
        .where("utt.teamId = :teamId", { teamId })
        .andWhere("utt.userId = :userId", { userId })
        .getOne();

      if (newTeam && uttData) {
        const createTeamResponse = {
          name: newTeam.name,
          teamId: newTeam.id,
          userId: userId,
          userToTeamId: uttData.userToTeamId,
        };
        return { errors: undefined, uttData: createTeamResponse };
      } else {
        return {
          errors: [
            {
              field: "createTeam (no field specified)",
              message: "Error creating new team",
            },
          ],
        };
      }
    } else {
      throw Error(`${unspecifiedError}: ${name}`);
    }
  }

  @UseMiddleware(isAuth, loggerMiddleware)
  @Query(() => [Team])
  async batchTeams() {
    const teamIds = [
      "f1b8f931-8bcc-471d-b6c3-db67acfda29a",
      "4104ce49-06b2-4842-94b0-464f0e1f698e",
    ];
    console.log(
      "\nexampleTeamLoader",
      await exampleTeamLoader.loadMany(teamIds)
    );

    return await exampleTeamLoader.loadMany(teamIds);
  }

  @UseMiddleware(isAuth, loggerMiddleware)
  @Query(() => [UserToTeam])
  async getAllTeamMembers(
    @Arg("teamId") teamId: string
  ): Promise<UserToTeam[]> {
    // @Ctx() { userId }: MyContext

    console.log("RUNNING - GET ALL TEAM MEMBERS RESOLVER", { teamId });

    const teamMembers = await UserToTeam.createQueryBuilder("userToTeam")
      .leftJoinAndSelect("userToTeam.user", "user")
      .where("userToTeam.teamId = :teamId", { teamId })
      .getMany();

    // const teamMembersOld = await Team.createQueryBuilder("team")
    //   .relation("members")
    //   .of(teamId)
    //   .loadMany();

    const teamMembersAlso = await UserToTeam.createQueryBuilder("userToTeam")
      .relation(UserToTeam, "user")
      .of(teamId)
      .loadMany();

    console.log(
      "VIEW TEAM ID - GET ALL TEAM MEMBERS RESOLVER",
      inspect(
        {
          teamId,
          teamMembers,
          teamMembersAlso,
          // teamMembersOld
        },
        false,
        4,
        true
      )
    );

    return teamMembers;
  }

  @UseMiddleware(isAuth, loggerMiddleware)
  @Query(() => [UserToTeam])
  async getAllTeamsForUser(
    @Ctx() { payload }: MyContext
  ): Promise<UserToTeam[]> {
    const userId = payload?.userId;
    if (!userId) {
      throw new Error("User ID is undefined.");
    }
    // const getAllTeamsForUser = await Team.createQueryBuilder("team")
    //   .select()
    //   .leftJoinAndSelect("team.members", "member")
    //   .leftJoinAndSelect("team.channels", "channel")
    //   .leftJoinAndSelect("team.userToTeams", "userToTeams")
    //   .where("member.id = :userId", { userId })
    //   .getMany();

    const getAllTeamsForUserToo = await UserToTeam.createQueryBuilder("utt")
      .select()
      .where("utt.userId = :userId", { userId })
      .leftJoinAndSelect("utt.team", "teams")
      .getMany()
      .catch((error) => {
        throw Error(
          `Error loading UserToTeam\n${inspect(error, false, 4, true)}`
        );
      });
    console.log("OOF CHECK THIS", {
      userId,
      // getAllTeamsForUser,
      getAllTeamsForUserToo,
    });

    return getAllTeamsForUserToo;
  }

  @UseMiddleware(loggerMiddleware)
  @Mutation(() => User, { nullable: true })
  async teamLogin(
    @Args() { email, password, teamId }: TeamLoginArgs,
    @Ctx() { req }: MyContext
  ): Promise<User | null> {
    console.log({ email, password, teamId, req });
    const teamUser = await User.createQueryBuilder("user")
      .leftJoinAndSelect("user.teams", "team")
      .where("user.email = :email", { email })
      .andWhere("team.id = :userId", { teamId })
      .getOne();

    if (!teamUser) {
      return null;
    }

    const validTeamUser = await bcrypt.compare(password, teamUser.password);

    // if the supplied password is invalid return early
    if (!validTeamUser) {
      return null;
    }

    // if the user has not confirmed via email
    if (!teamUser.confirmed) {
      // throw new Error("Please  confirm your account. CONFIRM INVITATION???");
      return null;
    }
    console.log("TEAM USER", { teamUser, validTeamUser });

    // all is well return the user we found
    req.session!.userId = (teamUser && teamUser.id) || "";
    req.session!.teamId = teamId;
    return teamUser;
  }

  @UseMiddleware(isAuth, loggerMiddleware)
  @Query(() => [User], { nullable: "itemsAndList" })
  async teamMembers(@Arg("teamIds", () => [ID]) teamIds: string[]) {
    // console.log("LOADER OUTPUT", await teamMemberLoader.loadMany(teamIds));
    return await teamMemberLoader.loadMany(teamIds);

    // const members = await Team.createQueryBuilder("Team")
    //   .leftJoinAndSelect("Team.members", "member")
    //   .where("member.id IN (:...userIds)", { userIds })
    //   .getMany();

    // const teamIdToMembers: { [key: string]: User[] } = {};

    // members.forEach(ut => {
    //   if (ut.id in teamIdToMembers) {
    //     console.log("WHAT IS THIS?", teamIdToMembers[ut.id]);
    //     // teamIdToMembers[ut.id].push(ut.members);
    //   } else {
    //     teamIdToMembers[ut.id] = [(ut as any).__member__];
    //   }
    // });

    // console.log("DATA LOADER: BATCH USER LOADER RETURNING...", {
    //   what: userIds.map((userId: any) => teamIdToMembers[userId]),
    //   members: members[0].members,
    //   teamIdToMembers
    // });

    // return members[0].members;
  }
}
