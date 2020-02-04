import { Resolver, Query, Ctx } from "type-graphql";

import { MyContext } from "../../types/MyContext";
import { User } from "../../entity/User";
// import { Message } from "../../entity/Message";

@Resolver()
export class GetAllMessagesResolver {
  // @ts-ignore
  @Query(type => User, { nullable: true })
  async getAllMyMessages(@Ctx() context: MyContext) {
    const myUser = await User.createQueryBuilder("user")

      .leftJoinAndMapMany(
        "user.mappedMessages",
        "user.messages",
        "message"
        // "message.sentBy <> ''"
      )
      .leftJoinAndSelect("message.sentBy", "sentBy")
      .leftJoinAndSelect("message.user", "m_user")
      .where("user.id = :id", { id: context.userId })
      .groupBy("user.id")
      .addGroupBy("message.id")
      .addGroupBy("sentBy.id")
      .addGroupBy("m_user.id")
      .orderBy({ "message.created_at": "DESC" }) // "sentBy.firstName": "ASC",
      .getOne();

    return myUser;
  }
}
