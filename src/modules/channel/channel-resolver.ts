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
import { inspect } from "util";

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

export interface DataAddMessageToChannelInput {
  data: AddMessageToChannelInput;
}

@Resolver()
export class ChannelResolver {
  @Subscription(() => Message, {
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
    @Root() messagePayload: AddMessagePayload,
    @Arg("data") data: AddMessageToChannelInput
  ): Message {
    console.log("NEW MESSAGE SUB, MESSAGE PAYLOAD", {
      data,
      messagePayload,
      messagePayload_created_at: messagePayload.message.created_at,
    });

    // let returnObj = {
    //   id: messagePayload.message.id,
    //   message: messagePayload.message.message,
    //   sentBy: messagePayload.user,
    //   __typename: "Message"
    // };

    return messagePayload.message;
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
    @Ctx() { userId }: MyContext,
    @Arg("data")
    { channelId, teamId, files, message }: AddMessageToChannelInput,
    @PubSub(Topic.NewChannelMessage) publish: Publisher<AddMessagePayload>
  ): Promise<AddMessagePayload> {
    console.log("\n\n✅✅✅\n\nmandatory usage\n".toUpperCase(), { teamId });
    console.log("\n\n✅✅✅\n");
    const sentBy = await User.createQueryBuilder("user")
      .where("user.id = :id", { id: userId })
      .getOne();

    const receiver = await User.createQueryBuilder("user")
      .where("user.id = :id", { id: userId })
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
  @Authorized("ADMIN", "OWNER", "MEMBER")
  @Mutation(() => Channel)
  async createChannel(
    @Arg("input") { teamId, name }: AddChannelInput
  ): // @Arg("name", () => String) name: string,
  // @Arg("teamId", () => String) teamId: string
  // @Ctx() { userId }: MyContext
  Promise<Channel | undefined> {
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
      const newChannel = await Channel.createQueryBuilder("channel")
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
  @Authorized("ADMIN", "OWNER", "MEMBER")
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

    console.log("WHAT IS FIND CHANNELS", { teamId, findChannels });

    return findChannels;
  }

  @UseMiddleware(isAuth, loggerMiddleware)
  @Query(() => [User], { nullable: "itemsAndList" })
  async channelMembers(@Arg("channelIds", () => [ID]) channelIds: string[]) {
    // console.log("LOADER OUTPUT", await channelMemberLoader.loadMany(channelIds));
    return await channelMemberLoader.loadMany(channelIds);
  }
}
