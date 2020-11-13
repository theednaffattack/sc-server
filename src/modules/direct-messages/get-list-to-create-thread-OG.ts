import { Resolver, Ctx, Query, ObjectType, Field, ID } from "type-graphql";

import { User } from "../../entity/User";
import { MyContext } from "../../types/MyContext";
// import { Team } from "src/entity/Team";

@ObjectType()
export class TransUserReturn {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  firstName: string;

  @Field(() => String)
  lastName: string;

  @Field(() => [User], { nullable: "items" })
  thoseICanMessage: User[];
}

@Resolver()
export class GetListToCreateThread {
  @Query(() => TransUserReturn, { nullable: true })
  async getListToCreateThread(
    @Ctx() ctx: MyContext
    // @Arg("teamId") teamId: string
  ): Promise<any> {
    let me = ctx.req && ctx.req.session ? ctx.req.session.userId : null;
    if (me) {
      const thoseICanMessage: any[] = [];

      let meWithFollowers = await User.findOne(me, {
        relations: ["followers", "following"],
      });

      // FENCE START

      // let myTeam = await Team.createQueryBuilder("team")
      //   .where("channel.id = :id", { id: teamId })
      //   .getOne();

      // let teamMembers = await Team.createQueryBuilder()
      //   .relation(Team, "members")
      //   .of(myTeam) // you can use just team id as well
      //   .loadMany();

      // FENCE END FRI :: 2020/01/24 :: 3:45PM

      let returnObj: any = {};
      if (meWithFollowers) {
        meWithFollowers.followers.forEach((follower) => {
          thoseICanMessage.push(follower);
        });

        meWithFollowers.following.forEach((Ifollow) => {
          thoseICanMessage.push(Ifollow);
        });

        // const finalMessageList = new Set(thoseICanMessage);

        // const finalUniqMessageList = [
        //   ...new Set(thoseICanMessage.map(user => user.id))
        // ];

        // const finalMsgListArray = Array.from(finalMessageList);

        returnObj.id = meWithFollowers.id;

        returnObj.firstName = meWithFollowers.firstName;
        returnObj.lastName = meWithFollowers.lastName;
      }

      // const array = [
      //   { id: 3, name: "Central Microscopy", fiscalYear: 2018 },
      //   { id: 5, name: "Crystallography Facility", fiscalYear: 2018 },
      //   { id: 3, name: "Central Microscopy", fiscalYear: 2017 },
      //   { id: 5, name: "Crystallography Facility", fiscalYear: 2017 }
      // ];
      const result = [];
      const map = new Map();
      for (const item of thoseICanMessage) {
        if (!map.has(item.id)) {
          map.set(item.id, true); // set any value to Map
          result.push({
            ...item,
          });
        }
      }

      returnObj.thoseICanMessage = [...result];
      return returnObj;
    } else {
      throw Error("Authentication error");
    }
  }
}
