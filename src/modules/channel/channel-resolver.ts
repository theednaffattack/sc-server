import {
  Resolver,
  Query,
  Mutation,
  Arg,
  ID,
  UseMiddleware,
  Ctx,
  Authorized,
  Subscription,
  Root,
  PubSub,
  Publisher,
  ResolverFilterData,
  // Args
} from "type-graphql";
import { inspect } from "util";

import { User } from "../../entity/User";
import { Channel } from "../../entity/Channel";
import { channelMemberLoader } from "../utils/data-loaders/batch-channel-members-loader";
import { isAuth } from "../middleware/isAuth";
import { loggerMiddleware } from "../middleware/logger";
import { MyContext } from "../../types/MyContext";
import { Message } from "../../entity/Message";
import { AddMessageToChannelInput } from "./add-message-to-channel-input";
// import { Image } from "../../entity/Image";
import { AddMessagePayload } from "./add-message-payload";
import { Team } from "../../entity/Team";
import { AddChannelInput } from "./add-channel-input";
import { IAddMessagePayload } from "./add-message-to-channel";
import { createFile } from "./channel-helpers/create-file";
import { createMessageWithoutFile } from "./channel-helpers/create-message-without-file";
import { Thread } from "../../entity/Thread";
import { AddThreadPayload } from "./add-thread-payload";
// import { deserialize } from "./deserialize-message";
// import { AddDirectMessagePayloadType } from "../direct-messages/direct-messages-resolver";

enum Topic {
  NewChannelMessage = "NEW_CHANNEL_MESSAGE",
  NewRecipe = "NEW_RECIPE",
}

// ADDITIONAL RESOLVERS NEEDED:
// Remove channel member

export interface AddChannelPayloadType {
  success: boolean;
  channelId: string;
  message: Message;
  user: User;
  invitees: User[];
}

export interface AddChannelMessagePayloadType {
  success: boolean;
  channelId: string;
  threadId: string;
  message: Message;
  sentBy: User;
  invitees: User["id"][];
}

export interface DataAddMessageToChannelInput {
  data: AddMessageToChannelInput;
}

@Resolver()
export class ChannelResolver {
  @Subscription(() => AddThreadPayload, {
    topics: [Topic.NewChannelMessage],
    filter: ({
      args,
      payload,
    }: ResolverFilterData<
      IAddMessagePayload,
      DataAddMessageToChannelInput
    >) => {
      const messageMatchesChannel = args.data.channelId === payload.channelId;

      if (messageMatchesChannel) {
        return true;
      } else {
        return false;
      }

      // return true;
    },
  })
  newMessageSub(
    @Root() messagePayload: AddThreadPayload,
    @Arg("data") data: AddMessageToChannelInput
  ): AddThreadPayload {
    // desctructure for easier use
    const {
      channelId,
      created_at,
      invitees,
      message,
      sentBy,
      success,
      threadId,
    } = messagePayload;

    const transformDatesForRedis: AddThreadPayload = {
      channelId,
      created_at: new Date(created_at),
      invitees,
      message: {
        ...message,
        created_at: new Date(message.created_at!),
        updated_at: new Date(message.updated_at!),
      },
      sentBy,
      success,
      threadId,
    };

    console.log("VIEW MESSAGE SUB DATA", {
      data,
      messagePayload,
      transformDatesForRedis,
    });

    return transformDatesForRedis;
  }

  @UseMiddleware(isAuth, loggerMiddleware)
  @Authorized("ADMIN", "OWNER", "MEMBER")
  @Query(() => String)
  async getChannelName(
    @Arg("channelId", () => String) channelId: string
  ): Promise<string> {
    const findChannel = await Channel.createQueryBuilder("channel")
      .where("channel.id = :id", { id: channelId })
      .getOne();

    return findChannel?.name ?? "no name found";
  }

  @UseMiddleware(isAuth, loggerMiddleware)
  @Authorized("ADMIN", "OWNER", "MEMBER")
  @Mutation(() => AddMessagePayload)
  async addMessageToChannel(
    @Ctx() ctx: MyContext,
    @Arg("data")
    { channelId, teamId, files, message }: AddMessageToChannelInput,
    @PubSub(Topic.NewChannelMessage) publish: Publisher<AddMessagePayload>
  ): Promise<AddMessagePayload> {
    console.log("\n\n✅✅✅\n\nmandatory usage\n".toUpperCase(), { teamId });
    console.log("\n\n✅✅✅\n");
    const sentBy = await User.createQueryBuilder("user")
      .where("user.id = :id", { id: ctx.payload?.token?.userId })
      .getOne();

    const receiver = await User.createQueryBuilder("user")
      .where("user.id = :id", { id: ctx.payload?.token?.userId })
      .getOne();

    // let existingChannel;
    // let newMessage: any;

    // if we know the addresser and addressee AND *FILES* ARE present...
    if (
      sentBy !== undefined &&
      receiver !== undefined &&
      files &&
      files.length > 0
    ) {
      let returnObj = await createFile({
        channelId: channelId,
        files: files,
        message: message,
        receiver,
        sentBy,
      });

      console.log(
        "OKAY PUBLISHING FILE - addMessageToChannel Resolver",
        inspect(returnObj.message.created_at, false, 4, true)
      );

      await publish(returnObj).catch((error: Error) => {
        throw new Error(error.message);
      });

      return returnObj;
    }

    // if we know the addresser and addressee AND **FILES** ARE NOT present...
    if (
      (sentBy && receiver && files === undefined) ||
      (sentBy && receiver && files && files.length === 0)
    ) {
      let returnObj = await createMessageWithoutFile({
        channelId,
        message,
        receiver,
        sentBy,
      });

      await publish(returnObj).catch((error: Error) => {
        throw new Error(error.message);
      });

      return returnObj;
    }
    // otherwise throw an error
    throw Error(
      `unable to find sender or receiver / sender / image: ${sentBy}\nreceiver: ${receiver}`
    );
  }

  @UseMiddleware(isAuth, loggerMiddleware)
  @Authorized("ADMIN", "OWNER", "MEMBER")
  @Mutation(() => AddThreadPayload)
  async addThreadToChannel(
    @Ctx() ctx: MyContext,
    @Arg("data")
    {
      channelId,
      invitees,
      teamId,
      // files,
      message: message_text,
    }: AddMessageToChannelInput,

    @PubSub(Topic.NewChannelMessage)
    publish: Publisher<AddThreadPayload>
  ): Promise<AddThreadPayload> {
    console.log("VIEW ADD THREAD PAYLOAD", {
      channelId,
      invitees,
      teamId,
      // files,
      message: message_text,
    });

    // Create a new Thread
    let { raw: rawThread } = await Thread.createQueryBuilder("thread")
      .insert()
      .values([{ last_message: message_text }])
      .execute();

    // Create a new Message as well
    let { raw: rawMessage } = await Message.createQueryBuilder("message")
      .insert()
      .values([
        { message: message_text, sentBy: { id: ctx.payload?.token?.userId } },
      ])
      .execute();

    let [propThread] = rawThread;

    let [propMessage] = rawMessage;

    // Add our new Thread into the existing Channel
    await Channel.createQueryBuilder("channel")
      .relation("channel", "threads")
      .of(channelId)
      .add(propThread.id)
      .catch((error) => console.error(error));

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

    let fullThread = await Thread.createQueryBuilder("thread")
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
      .where("user.id = :userId", { userId: ctx.payload?.token?.userId })
      .getOne();

    if (fullNewMessage && sentBy && fullThread) {
      await publish({
        channelId,
        created_at: fullThread.created_at,
        invitees: dmInvitees,
        message: fullNewMessage,
        success: true,
        threadId: idThread,
        sentBy,
      });

      return {
        channelId,
        created_at: fullThread.created_at,
        invitees: dmInvitees,
        message: fullNewMessage,
        success: true,
        threadId: idThread,
        sentBy,
      };
    } else {
      throw Error("Nothing saved");
    }
  }

  @UseMiddleware(isAuth, loggerMiddleware)
  // @Authorized("ADMIN", "OWNER", "MEMBER")
  @Mutation(() => Boolean)
  async addChannelMember(
    @Ctx() context: MyContext,

    @Arg("userId", () => String) userId: string,
    @Arg("channelId", () => String) channelId: string
  ) {
    console.log("USER ID (addChannelMember)", {
      ctxUser: context.userId,
      argUser: userId,
    });

    const getUser = await User.createQueryBuilder("user")
      .where("user.id = :id", { id: userId })
      .getOne()
      .catch((err) => {
        throw Error(err);
      });

    let addMemberResult;
    let successMessage = "addition successful";
    let failureMessage = "addition rejected";

    // @ts-ignore
    const addUser = await Channel.createQueryBuilder("channel")
      .relation("channel", "invitees")
      .of(channelId)
      .add(getUser)
      .then(
        () => {
          addMemberResult = successMessage;
        },
        () => {
          addMemberResult = failureMessage;
        }
      )
      .catch((err) => {
        throw Error(err);
      });

    if (addMemberResult === successMessage) {
      return true;
    } else {
      return false;
    }
  }

  @UseMiddleware(isAuth, loggerMiddleware)
  @Authorized("ADMIN", "OWNER", "MEMBER")
  @Mutation(() => Boolean)
  async removeChannelMember(
    @Arg("userId", () => ID) userId: string,
    @Arg("channelId", () => String) channelId: string
  ): Promise<Boolean> {
    const getUser = await User.createQueryBuilder("user")
      .where("user.id = :id", { id: userId })
      .getOne()
      .catch((err) => {
        throw Error(err);
      });

    let deleteMember;
    let successMessage = "deletion successful";
    let failureMessage = "deletion failure";

    if (getUser) {
      await Channel.createQueryBuilder("channel")
        .relation("channel", "invitees")
        .of(channelId)
        .remove(getUser.id)
        .then(
          () => (deleteMember = successMessage),
          () => (deleteMember = failureMessage)
        )
        .catch((err) => {
          deleteMember = "deletion error";
          console.error("Error deleting channel member", err);
        });
    }

    ("deletion rejected");

    if (deleteMember === successMessage) {
      return true;
    } else {
      return false;
    }
  }

  @UseMiddleware(isAuth, loggerMiddleware)
  // @Authorized("ADMIN", "OWNER", "MEMBER")
  @Mutation(() => Channel)
  async createChannel(
    @Arg("input") { teamId, name }: AddChannelInput,
    @Ctx() ctx: MyContext
  ): Promise<Channel | undefined> {
    console.log("IS THIS WORKING??");

    const existingTeam = await Team.createQueryBuilder("team")
      .where("team.id = :teamId", { teamId })
      .getOne();

    console.log("WHAT'S COMING BACK? - CHECK ARGS", {
      existingTeam,
      name,
      teamId,
    });

    const { raw } = await Channel.createQueryBuilder("channel")
      .insert()
      .into("channel")
      .values({ name, team: existingTeam }) // , created_by: userId
      .execute();

    if (raw) {
      const { id } = raw[0];

      await Channel.createQueryBuilder("channel")
        .relation("channel", "invitees")
        .of(id)
        .add(ctx.payload?.token?.userId)
        .catch((error) => console.error(error));

      const newChannel = await Channel.createQueryBuilder("channel")
        .leftJoinAndSelect("channel.invitees", "invitees")
        .where("channel.id = :id", { id })
        .getOne();

      return newChannel;
    } else {
      throw Error(`Unspecified error creating channel: ${name}`);
    }
  }

  @UseMiddleware(isAuth, loggerMiddleware)
  @Authorized("ADMIN", "OWNER", "MEMBER")
  @Query(() => [User])
  async getAllChannelMembers(
    @Arg("channelId", () => String) channelId: string
  ): Promise<User[]> {
    const getMessages = await Channel.createQueryBuilder("channel")
      .relation("channel", "invitees")
      .of(channelId)
      .loadMany();

    return getMessages;
  }

  @UseMiddleware(isAuth, loggerMiddleware)
  @Authorized("ADMIN", "OWNER", "MEMBER")
  @Query(() => [Message])
  async getAllChannelMessages(
    @Arg("channelId", () => String, { nullable: true }) channelId: string,
    @Arg("teamId", () => String, { nullable: true }) teamId: string
  ): Promise<Message[]> {
    const getMessages = await Channel.createQueryBuilder("channel")
      .leftJoinAndSelect("channel.messages", "messages")
      .leftJoinAndSelect("messages.files", "files")
      .leftJoinAndSelect("messages.sentBy", "sentBy")

      .orderBy("messages.created_at", "ASC")
      .where("channel.id = :channelId", { channelId })
      .getOne();

    console.log(
      "AVOIDING TS UNUSED VARIABLE ERROR",
      inspect(
        { teamId, getMessages_created_at: getMessages?.created_at },
        false,
        2,
        true
      )
    );

    // TODO: see if this will work in a try catch
    // when supplying a bad ID
    // const getMessages = await Channel.createQueryBuilder("channel")
    //   .relation("channel", "messages")
    //   .of(channelId)
    //   .loadMany()
    //   .then(data => {
    //     console.log("DATA", data);
    //     return data;
    //   })
    //   .catch(error => new Error(`Error fetching messages ${error}`));

    if (
      getMessages !== undefined &&
      getMessages.messages &&
      getMessages.messages.length > 0
    ) {
      return getMessages.messages;
    } else {
      return [];
    }
  }

  @UseMiddleware(isAuth, loggerMiddleware)
  // @Authorized("ADMIN", "OWNER", "MEMBER")
  @Query(() => [Thread])
  async getAllChannelThreads(
    @Arg("channelId", () => String, { nullable: true }) channelId: string,
    @Arg("teamId", () => String, { nullable: true }) teamId: string
  ): Promise<Thread[]> {
    const getThreads = await Thread.createQueryBuilder("thread")
      .leftJoinAndSelect("thread.channel", "channel")
      .leftJoinAndSelect("thread.team", "team")
      .leftJoinAndSelect("thread.invitees", "invitees")
      .leftJoinAndSelect("thread.messages", "messages")
      // .leftJoinAndSelect("messages.sentBy", "sentBy")

      .orderBy("thread.created_at", "ASC")
      .where("channel.id = :channelId", { channelId })
      .andWhere("team.id = :teamId", { teamId })
      .getMany();

    return getThreads;
  }

  @UseMiddleware(isAuth, loggerMiddleware)
  @Authorized("ADMIN", "OWNER", "MEMBER")
  @Mutation(() => Boolean)
  async updateChannelName(
    @Arg("name", () => String) name: string,
    @Arg("channelId", () => String) channelId: string
  ): Promise<Boolean> {
    const updatedChannelName = await Channel.createQueryBuilder("channel")
      .update("channel")
      .set({ name })
      .where("id = :id", { id: channelId })
      .execute()
      .catch((error) => new Error(error));

    console.log("updatedChannelName".toUpperCase(), updatedChannelName);
    if (updatedChannelName) {
      return true;
    } else {
      return false;
    }
  }

  @UseMiddleware(isAuth, loggerMiddleware)
  @Authorized("ADMIN", "OWNER", "MEMBER")
  @Mutation(() => Boolean)
  async deleteChannel(
    @Arg("channelName", () => String) channelName: string,
    @Arg("channelId", () => String) channelId: string
  ): Promise<Boolean> {
    console.log({ channelName, channelId });

    // IF CHANNELID SUPPLIED
    if (channelId) {
      const { affected } = await Channel.createQueryBuilder("channel")
        .delete()
        .from("channel")
        .where("id = :id", { id: channelId })
        .execute();

      console.log({ affected });

      if (affected === 1) {
        return true;
      } else {
        return false;
      }
    }

    // IF CHANNEL NAME & CHANNEL ID IS MISSING SUPPLIED
    if (channelName && !channelId) {
      const getChannelIdFromName = await Channel.createQueryBuilder("channel")
        .select()
        .where("name = :name", { name: channelName })
        .getOne();

      const { affected } = await Channel.createQueryBuilder("channel")
        .delete()
        .from("channel")
        .where("id = :id", { id: getChannelIdFromName })
        .execute();

      if (affected === 1) {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

  @UseMiddleware(isAuth, loggerMiddleware)
  // @Authorized("ADMIN", "OWNER", "MEMBER")
  @Query(() => [Channel])
  async loadChannelsByTeamId(
    // @Ctx() { userId }: MyContext,
    @Arg("teamId", { nullable: false }) teamId: string
  ) {
    console.log("WHAT IS TEAM ID", { teamId });
    let findChannels = await Channel.createQueryBuilder("channel")
      .leftJoinAndSelect("channel.team", "teamAlias")
      .leftJoinAndSelect("channel.invitees", "invitees")
      .where("teamAlias.id = :teamId", { teamId })
      .getMany();

    return findChannels;
  }

  @UseMiddleware(isAuth, loggerMiddleware)
  @Query(() => [User], { nullable: "itemsAndList" })
  async channelMembers(@Arg("channelIds", () => [ID]) channelIds: string[]) {
    // console.log("LOADER OUTPUT", await channelMemberLoader.loadMany(channelIds));
    return await channelMemberLoader.loadMany(channelIds);
  }
}
