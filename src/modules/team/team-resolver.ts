import {
  Resolver,
  Query,
  Mutation,
  Arg,
  ID,
  UseMiddleware,
  Ctx,
  Authorized
} from "type-graphql";
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
    const { raw } = await Team.createQueryBuilder("team")
      .insert()
      .into("team")
      .values({ name })
      .execute();

    if (raw) {
      const { id } = raw[0];
      const newTeam = await Team.createQueryBuilder("team")
        .where("team.id = :id", { id })
        .getOne();

      return newTeam;
    } else {
      throw Error(`Unspecified error creating team: ${name}`);
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
  @Query(() => [Team])
  async loadTeams(@Ctx() { userId }: MyContext) {
    // const localUserIds = [""];
    return await Team.find({ where: { id: userId } });
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
