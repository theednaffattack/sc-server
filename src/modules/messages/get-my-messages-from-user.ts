import { Resolver, Query, Arg, Ctx, UseMiddleware } from "type-graphql";

import { Message } from "../../entity/Message";
import { GetMessagesFromUserInput } from "./message-input";
import { MyContext } from "../../types/MyContext";
import { isAuth } from "../middleware/isAuth";

@Resolver()
export class GetMyMessagesFromUserResolver {
  @UseMiddleware(isAuth)
  // @ts-ignore
  @Query(type => [Message], { nullable: true })
  async getMyMessagesFromUser(
    @Ctx() context: MyContext,
    // @ts-ignore
    @Arg("input", type => GetMessagesFromUserInput)
    input: GetMessagesFromUserInput
  ) {
    const newMessages: Message[] = await Message.find({
      where: { userId: context.userId, sentBy: input.sentBy },
      relations: ["user"]
    });

    return newMessages;
  }
}
