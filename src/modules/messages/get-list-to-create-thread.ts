import { Resolver, Ctx, Query, ObjectType, Field, ID } from "type-graphql";

import { User } from "../../entity/User";
import { MyContext } from "../../types/MyContext";

@ObjectType()
export class TransUserReturn {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  firstName: string;

  @Field(() => String)
  lastName: string;

  @Field(() => [User], { nullable: true })
  thoseICanMessage: any[];
}

@Resolver()
export class GetListToCreateThread {
  @Query(() => TransUserReturn, { nullable: true })
  async getListToCreateThread(@Ctx() ctx: MyContext): Promise<any> {
    let me = ctx.req && ctx.req.session ? ctx.req.session.userId : null;
    if (me) {
      const thoseICanMessage: any[] = [];

      let meWithFollowers = await User.findOne(me, {
        relations: ["followers", "following"]
      });

      let returnObj: any = {};
      if (meWithFollowers) {
        meWithFollowers.followers.forEach(follower => {
          thoseICanMessage.push(follower);
        });

        meWithFollowers.following.forEach(Ifollow => {
          thoseICanMessage.push(Ifollow);
        });

        const finalMessageList = new Set(thoseICanMessage);

        // @ts-ignore
        const finalUniqMessageList = [
          ...new Set(thoseICanMessage.map(user => user.id))
        ];

        // @ts-ignore
        const finalMsgListArray = Array.from(finalMessageList);

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
            ...item
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
