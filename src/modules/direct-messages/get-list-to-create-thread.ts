import {
  Resolver,
  Ctx,
  Query,
  Arg,
  UseMiddleware,
  Authorized
} from "type-graphql";

import { User } from "../../entity/User";
import { MyContext } from "../../types/MyContext";
import { Team } from "../../entity/Team";
import { isAuth } from "../middleware/isAuth";
import { loggerMiddleware } from "../middleware/logger";

// @ObjectType()
// export class TransUserReturn {
//   @Field(() => ID)
//   id: string;

//   @Field(() => String)
//   firstName: string;

//   @Field(() => String)
//   lastName: string;

//   @Field(() => [User], { nullable: "items" })
//   thoseICanMessage: User[];
// }

@Resolver()
export class GetListToCreateThread {
  @UseMiddleware(isAuth, loggerMiddleware)
  @Authorized("ADMIN", "OWNER", "MEMBER")
  @Query(() => [User], { nullable: "items" })
  async getListToCreateThread(
    @Ctx() ctx: MyContext,
    @Arg("teamId", () => String) teamId: string
  ): Promise<User[]> {
    let me = ctx.req && ctx.req.session ? ctx.req.session.userId : null;
    if (me) {
      // const thoseICanMessage: any[] = [];

      // let meWithFollowers = await User.findOne(me, {
      //   relations: ["followers", "following"]
      // });

      // FENCE START

      let myTeam = await Team.createQueryBuilder("team")
        .where("team.id = :id", { id: teamId })
        .getOne();

      let teamMembers = await Team.createQueryBuilder("team")
        .relation("team", "members")
        .of(myTeam) // you can use just team id as well
        .loadMany();

      // FENCE END FRI :: 2020/01/24 :: 3:45PM

      console.log("VIEW TEAM MEMBERS", teamMembers);
      return teamMembers;
    } else {
      throw Error("Authentication error");
    }
  }
}
