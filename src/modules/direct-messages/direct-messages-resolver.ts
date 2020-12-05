import {
  Arg,
  Authorized,
  Ctx,
  Mutation,
  Resolver,
  UseMiddleware,
  Subscription,
  Root,
  PubSub,
  Publisher,
  Query,
} from "type-graphql";

import { isAuth } from "../middleware/isAuth";
import { loggerMiddleware } from "../middleware/logger";
import { User } from "../../entity/User";
import { Message } from "../../entity/Message";
import { AddDirectMessagePayload } from "./add-direct-message-payload";
import { CreateDirectMessageInput } from "./create-direct-message-input";
import { AddDirectMessageToThreadInput } from "./add-direct-message-to-thread-input";

import { Thread } from "../../entity/Thread";
import { MyContext } from "../../types/MyContext";
import { Team } from "../../entity/Team";

enum Topic {
  NewDirectMessage = "NEW_DIRECT_MESSAGE",
  NewRecipe = "NEW_RECIPE",
}

// ADDITIONAL RESOLVERS NEEDED:
// Remove channel member

export interface AddDirectMessagePayloadType {
  success: boolean;
  threadId: string;
  message: Message;
  sentBy: User;
  invitees: User["id"][];
}

@Resolver()
export class DirectMessageResolver {
  @Subscription(() => AddDirectMessagePayload, {
    topics: [Topic.NewDirectMessage],
    filter: () => {
      return true;
    },
  })
  newDirectMessageSub(
    @Root() directMessagePayload: AddDirectMessagePayloadType
  ): AddDirectMessagePayloadType {
    return directMessagePayload;
  }

  @UseMiddleware(isAuth, loggerMiddleware)
  @Authorized("MEMBER", "OWNER", "ADMIN")
  @Mutation(() => AddDirectMessagePayload)
  async addDirectMessageToThread(
    @Ctx() { userId }: MyContext,
    @Arg("input")
    {
      // teamId,
      threadId,
      message_text,
      invitees,
    }: AddDirectMessageToThreadInput,
    @PubSub(Topic.NewDirectMessage)
    publish: Publisher<AddDirectMessagePayloadType>
  ): Promise<AddDirectMessagePayload> {
    let { raw: rawMessage } = await Message.createQueryBuilder("message")
      .insert()
      .values([{ message: message_text, sentBy: { id: userId } }])
      .execute();

    await Thread.createQueryBuilder("thread")
      .update("thread")
      .set({ last_message: message_text })
      .where("thread.id = :threadId", { threadId })
      .execute();

    let [propMessage] = rawMessage;

    let {
      id: idMessage,
      // created_at: createdAtMessage,
      // updated_at: updatedAtMessage,
    } = propMessage;

    let dmInvitees = await User.createQueryBuilder("user")
      .where("user.id IN (:...userIds)", { userIds: [...invitees] })
      .getMany();

    await Promise.all(
      // add the message to each user
      dmInvitees.map(async (userObj) => {
        return await User.createQueryBuilder("user")
          .relation("user", "messages")
          .of(userObj)
          .add(idMessage)
          .catch((error) => console.error(error));
      })
    );

    // add message to thread // ONE TO MANY
    await Thread.createQueryBuilder("thread")
      .relation("thread", "messages")
      .of(threadId)
      .add(idMessage) // use add rather than set for ONE TO MANY AND MANY TO MANY
      .catch((error) => console.error(error));

    // add thread to message // MANY TO ONE
    await Message.createQueryBuilder("message")
      .relation("message", "thread")
      .of(idMessage) // you can use just post id as well
      .set(threadId) // you can use just category id as well // use set for MANY TO ONE AND ONE TO ONE
      .catch((error) => console.error(error));

    let fullNewMessage = await Message.createQueryBuilder("message")
      .leftJoinAndSelect("message.sentBy", "sentBy")
      .where("message.id = :messageId", { messageId: idMessage })
      .getOne();

    if (fullNewMessage) {
      await publish({
        invitees: dmInvitees.map((person) => person.id),
        message: fullNewMessage,
        success: true,
        threadId: threadId,
        sentBy: fullNewMessage.sentBy,
      });

      return {
        invitees: dmInvitees,
        message: fullNewMessage,
        success: true,
        threadId,
        sentBy: fullNewMessage.sentBy,
      };
    } else {
      throw Error("Nothing saved");
    }
  }

  @UseMiddleware(isAuth, loggerMiddleware)
  @Authorized("ADMIN", "OWNER", "MEMBER")
  @Mutation(() => AddDirectMessagePayload)
  async createDirectMessage(
    @Ctx() { userId }: MyContext,
    @Arg("input") { teamId, message_text, invitees }: CreateDirectMessageInput,
    @PubSub(Topic.NewDirectMessage) publish: Publisher<AddDirectMessagePayload>
  ): Promise<AddDirectMessagePayload> {
    let { raw: rawThread } = await Thread.createQueryBuilder("thread")
      .insert()
      .values([{ last_message: message_text }])
      .execute();

    let { raw: rawMessage } = await Message.createQueryBuilder("message")
      .insert()
      .values([{ message: message_text, sentBy: { id: userId } }])
      .execute();

    let [propThread] = rawThread;

    let [propMessage] = rawMessage;

    let {
      id: idThread,
      // created_at: createdAtThread,
      // updated_at: updatedAtThread,
    } = propThread;
    let {
      id: idMessage,
      // created_at: createdAtMessage,
      // updated_at: updatedAtMessage,
    } = propMessage;

    let dmInvitees = await User.createQueryBuilder("user")
      .where("user.id IN (:...userIds)", { userIds: [...invitees] })
      .getMany();

    await Promise.all(
      // add the message to each user
      dmInvitees.map(async (userObj) => {
        return await User.createQueryBuilder("user")
          .relation("user", "messages")
          .of(userObj)
          .add(idMessage)
          .catch((error) => console.error(error));
      })
    );

    // add message to thread // ONE TO MANY
    await Thread.createQueryBuilder("thread")
      .relation("thread", "messages")
      .of(idThread)
      .add(idMessage) // use add rather than set for ONE TO MANY AND MANY TO MANY
      .catch((error) => console.error(error));

    // add Team to Thread // MANY TO ONE
    await Thread.createQueryBuilder("thread")
      .relation("thread", "team")
      .of(idThread)
      .set(teamId) // use set for MANY TO ONE AND ONE TO ONE
      .catch((error) => console.error(error));

    // // add Team to Thread // ONE TO MANY
    // await Team.createQueryBuilder("team")
    //   .relation("team", "threads")
    //   .of(teamId)
    //   .add(idThread) // use add rather than set for ONE TO MANY AND MANY TO MANY
    //   .then(data => {
    //     console.log("// add Team to Thread // ONE TO MANY", data);
    //     return data;
    //   })
    //   .catch(error => console.error(error));

    // add invitees to thread // MANY TO MANY
    await Thread.createQueryBuilder("thread")
      .relation("thread", "invitees")
      .of(idThread)
      .add(invitees) // use add rather than set for ONE TO MANY AND MANY TO MANY
      .catch((error) => console.error(error));

    // add thread to message // MANY TO ONE
    await Message.createQueryBuilder("message")
      .relation("message", "thread")
      .of(idMessage) // you can use just post id as well
      .set(idThread) // you can use just category id as well // use set for MANY TO ONE AND ONE TO ONE
      .catch((error) => console.error(error));

    let fullNewMessage = await Message.createQueryBuilder("message")
      .leftJoinAndSelect("message.sentBy", "sentBy")
      .where("message.id = :messageId", { messageId: idMessage })
      .getOne();

    await Thread.createQueryBuilder("thread")
      .leftJoinAndSelect("thread.team", "team")
      .where("thread.id = :threadId", { threadId: idThread })
      .getOne();

    await Team.createQueryBuilder("team")
      .leftJoinAndSelect("team.threads", "thread")
      .where("team.id = :teamId", { teamId: teamId })
      .getOne();

    // fullNewMessage.sentBy = Message.createQueryBuilder("message")
    //   .relation("message", "sentBy")
    //   .of(idMessage)
    //   .loadOne();

    let sentBy = await User.createQueryBuilder("user")
      .where("user.id = :userId", { userId })
      .getOne();

    if (fullNewMessage && sentBy) {
      await publish({
        invitees: dmInvitees,
        message: fullNewMessage,
        success: true,
        threadId: idThread,
        sentBy,
      });

      return {
        invitees: dmInvitees,
        message: fullNewMessage,
        success: true,
        threadId: idThread,
        sentBy,
      };
    } else {
      throw Error("Nothing saved");
    }

    // );

    // const { raw } = await Channel.createQueryBuilder("channel")
    //   .insert()
    //   .into("channel")
    //   .values({ name, team: existingTeam }) // , created_by: userId
    //   .execute();

    // if (raw) {
    //   const { id } = raw[0];
    //   const newChannel = await Channel.createQueryBuilder("channel")
    //     .where("channel.id = :id", { id })
    //     .getOne();

    //   return newChannel;
    // } else {
    //   throw Error(`Unspecified error creating channel: ${name}`);
    // }
  }

  @UseMiddleware(isAuth, loggerMiddleware)
  @Authorized("ADMIN", "OWNER", "MEMBER")
  @Query(() => Thread)
  async loadDirectMessagesThreadById(
    @Arg("threadId") threadId: string,
    //@ts-ignore
    @Arg("teamId") teamId: string
  ): Promise<Thread> {
    let getDirectMessagesByThreadId = await Thread.createQueryBuilder("thread")
      .leftJoinAndSelect("thread.team", "team")
      .leftJoinAndSelect("thread.messages", "messages")
      .leftJoinAndSelect("thread.invitees", "invitees")
      .leftJoinAndSelect("messages.sentBy", "sentBy")
      .where("thread.id = :threadId", { threadId })
      .getOne()
      .catch((error) =>
        console.error(
          `ERROR FETCHING THREAD MESSAGES (THREAD ID: ${threadId})`,
          error
        )
      );

    if (getDirectMessagesByThreadId) {
      return getDirectMessagesByThreadId;
    } else {
      throw Error(`Could not find Direct Messages by Thread ID: ${threadId}`);
    }
  }

  @UseMiddleware(isAuth, loggerMiddleware)
  @Authorized("ADMIN", "OWNER", "MEMBER")
  @Query(() => [Thread])
  async loadDirectMessageThreadsByTeamAndUser(
    @Arg("teamId") teamId: String,
    @Ctx() ctx: MyContext
  ): Promise<Thread[]> {
    const loadedThreads = await Thread.createQueryBuilder("thread")
      .leftJoinAndSelect("thread.invitees", "invitee")
      .leftJoinAndSelect("thread.channel", "channel")
      .leftJoinAndSelect("thread.invitees", "inviteeReal")
      .leftJoinAndSelect("thread.team", "team")
      .leftJoinAndSelect("thread.messages", "message")
      .where("invitee.id IN (:...userId)", { userId: [ctx.userId] })
      .andWhere("team.id = :teamId", { teamId })
      .andWhere("channel IS NULL")
      .getMany();

    return loadedThreads;
  }
}
