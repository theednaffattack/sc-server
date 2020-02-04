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
  Args
} from "type-graphql";
import bcrypt from "bcryptjs";

import { User } from "../../entity/User";
import { Team } from "../../entity/Team";
import { exampleTeamLoader } from "../utils/data-loaders/batch-example-loader";
import { teamMemberLoader } from "../utils/data-loaders/batch-team-members-loader";
import { isAuth } from "../middleware/isAuth";
import { loggerMiddleware } from "../middleware/logger";
import { MyContext } from "src/types/MyContext";

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

@Resolver()
export class UserTeamResolver {
  @UseMiddleware(isAuth, loggerMiddleware)
  @Authorized("ADMIN", "OWNER")
  @Mutation(() => Boolean)
  async addTeamMember(
    @Arg("userId", () => String) userId: string,
    @Arg("teamId", () => String) teamId: string
  ) {
    const getUser = await User.createQueryBuilder("user")
      .where("user.id = :id", { id: userId })
      .getOne()
      .catch(err => {
        throw Error(err);
      });

    await Team.createQueryBuilder("team")
      .relation("team", "members")
      .of(teamId)
      .add(getUser)
      .catch(err => {
        throw Error(err);
      });

    return true;
  }

  @UseMiddleware(isAuth, loggerMiddleware)
  @Authorized("ADMIN", "OWNER")
  @Mutation(() => Team)
  async createTeam(@Arg("name", () => String) name: string) {
    let duplicateTeamNameError;

    const unspecifiedError = "An unspecified error occurred while creating.";

    const teamResult = await Team.createQueryBuilder("team")
      .insert()
      .into("team")
      .values({ name })
      .execute()
      .catch(error => {
        const catchMessage = "duplicate key value violates unique constraint";
        console.error("CHECK ERROR\n", Object.keys(error));
        console.error("CHECK ERROR\n", {
          message: error.message,
          checkStatus: error.message.includes(catchMessage)
        });
        if (error.message.includes(catchMessage)) {
          duplicateTeamNameError =
            "A team with this name already exists. Please try again with a unique team name.";
        } else {
          console.log("WHY IS THIS HAPPENING?");
          throw Error(unspecifiedError);
        }
      });

    if (duplicateTeamNameError) {
      throw Error(duplicateTeamNameError);
    }

    if (teamResult && teamResult.raw) {
      const { id } = teamResult.raw[0];
      const newTeam = await Team.createQueryBuilder("team")
        .where("team.id = :id", { id })
        .getOne();

      return newTeam;
    } else {
      throw Error(`${unspecifiedError}: ${name}`);
    }
  }

  @UseMiddleware(isAuth, loggerMiddleware)
  @Query(() => [Team])
  async batchTeams() {
    const teamIds = [
      "f1b8f931-8bcc-471d-b6c3-db67acfda29a",
      "4104ce49-06b2-4842-94b0-464f0e1f698e"
    ];
    console.log(
      "\nexampleTeamLoader",
      await exampleTeamLoader.loadMany(teamIds)
    );

    return await exampleTeamLoader.loadMany(teamIds);
  }

  @UseMiddleware(isAuth, loggerMiddleware)
  @Query(() => [User])
  async getAllTeamMembers(@Arg("teamId") teamId: string): Promise<User[]> {
    // @Ctx() { userId }: MyContext

    // let teamIdFromFakeContext = "f1b8f931-8bcc-471d-b6c3-db67acfda29a"; // name = "ridiculous"
    const teamMembers = await Team.createQueryBuilder("team")
      .relation("members")
      .of(teamId)
      .loadMany();
    return teamMembers;
  }

  @UseMiddleware(isAuth, loggerMiddleware)
  @Query(() => [Team])
  async getAllTeamsForUser(@Ctx() { userId }: MyContext): Promise<Team[]> {
    const getAllTeamsForUser = await Team.createQueryBuilder("team")
      .select()
      .leftJoinAndSelect("team.members", "member")
      .leftJoinAndSelect("team.channels", "channel")
      // , "member.id = :userId", {
      //   userId
      // })
      .where("member.id = :userId", { userId })
      .getMany();

    return getAllTeamsForUser;
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
