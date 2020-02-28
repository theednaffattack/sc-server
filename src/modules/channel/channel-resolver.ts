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
  ResolverFilterData
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
import { Image } from "../../entity/Image";
import { AddMessagePayload } from "./add-message-payload";
import { Team } from "../../entity/Team";
import { AddChannelInput } from "./add-channel-input";
import { IAddMessagePayload } from "./add-message-to-channel";

enum Topic {
  NewChannelMessage = "NEW_CHANNEL_MESSAGE",
  NewRecipe = "NEW_RECIPE"
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
      payload
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
    }
  })
  newMessageSub(
    @Root() messagePayload: AddMessagePayload,
    @Arg("data") data: AddMessageToChannelInput
  ): Message {
    console.log("NEW MESSAGE SUB, MESSAGE PAYLOAD", { data, messagePayload });

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
    {
      // @ts-ignore
      channelId,
      images,
      message,
      teamId
    }: AddMessageToChannelInput,
    @PubSub(Topic.NewChannelMessage) publish: Publisher<AddMessagePayload>
  ): Promise<AddMessagePayload> {
    const sentBy = await User.createQueryBuilder("user")
      .where("user.id = :id", { id: userId })
      .getOne();

    const receiver = await User.createQueryBuilder("user")
      .where("user.id = :id", { id: userId })
      .getOne();

    let existingChannel;
    let newMessage: any;

    // if we know the addresser and addressee AND images ARE present...
    if (sentBy && receiver && images && images[0]) {
      console.log(
        "\n\n2a - TOP OF IF STAEMENT IN RESOLVER (ADD MESSAGE TO CHANNEL)",
        {
          userId,
          channelId,
          message,
          sentBy,
          receiver,
          images
        }
      );
      console.log("\n\n");
      const newImageData: Image[] = images.map(image =>
        Image.create({
          uri: `${image}`,
          user: sentBy
        })
      );

      // save that image to the database
      let newImages = await Promise.all(
        newImageData.map(async newImage => await newImage.save())
      );

      // add the images to the user.images
      // field / column
      if (newImages !== null && newImages.length > 0) {
        if (!sentBy.images || sentBy.images.length === 0) {
          sentBy.images = [...newImages];
        }
        if (sentBy.images && sentBy.images.length > 0) {
          sentBy.images = [...sentBy.images, ...newImages];
        }
      }

      let createMessage = {
        message: message,
        user: receiver,
        sentBy,
        images: [...newImages]
      };

      // CREATING rather than REPLYING to message...
      newMessage = await Message.create(createMessage).save();

      newImages.forEach(async image => {
        image.message = newMessage.id;
        await image.save();
        return image;
      });

      existingChannel = await Channel.findOne(channelId, {
        relations: ["messages", "invitees", "messages.images"]
      }).catch(error => error);

      const foundThread = existingChannel && existingChannel.id ? true : false;

      existingChannel.last_message = message;

      existingChannel.save();

      newMessage.channel = existingChannel;

      await newMessage.save();

      // let collectInvitees: any[] = [];

      // await Promise.all(
      //   invitees.map(async person => {
      //     let tempPerson = await User.findOne(person);
      //     collectInvitees.push(tempPerson);
      //     return tempPerson;
      //   })
      // );

      const returnObj = {
        success: existingChannel && foundThread ? true : false,
        channelId: channelId,
        message: newMessage,
        user: receiver
        // invitees: [...collectInvitees]
      };

      // await publish(returnObj).catch((error: Error) => {
      //   throw new Error(error.message);
      // });

      return returnObj;
    }

    // if we know the addresser and addressee AND images ARE NOT present...
    if (
      (sentBy && receiver && images === undefined) ||
      (sentBy && receiver && images!.length === 0)
    ) {
      console.log(
        "\n\n2b - TOP OF IF STAEMENT IN RESOLVER (ADD MESSAGE TO CHANNEL)",
        {
          userId,
          channelId,
          message,
          sentBy,
          receiver
        }
      );
      console.log("\n\n");
      let createMessage = {
        message: message,
        user: receiver,
        sentBy
      };

      existingChannel = await Channel.findOne(channelId, {
        relations: ["messages", "invitees", "messages.images"]
      }).catch(error => error);

      newMessage = await Message.create(createMessage).save();

      existingChannel.last_message = message;
      await existingChannel.save();

      newMessage.channel = existingChannel;

      await newMessage.save();

      // let collectInvitees: User[] = [];

      // await Promise.all(
      //   invitees.map(async person => {
      //     let tempPerson = await User.findOne(person);
      //     if (tempPerson) {
      //       collectInvitees.push(tempPerson);
      //     }
      //     return tempPerson;
      //   })
      // );

      const returnObj = {
        success: existingChannel && existingChannel.id ? true : false,
        channelId: channelId,
        message: newMessage,
        user: receiver,
        invitees: []
        // invitees: [...collectInvitees]
      };

      console.log(
        "\n\n3 - BEFORE PUBLISH IN RESOLVER (ADD MESSAGE TO CHANNEL)",
        {
          userId,
          channelId,
          message,
          sentBy,
          receiver,
          returnObj
        }
      );
      console.log("\n\n");

      await publish(returnObj).catch(error =>
        console.log("VIEW ERROR\n", error)
      );
      console.log("RETURNOBJ PUBLISHED", { returnObj });

      return returnObj;
    } else {
      throw Error(
        `unable to find sender or receiver / sender / image: ${sentBy}\nreceiver: ${receiver}`
      );
    }

    // return {
    //   success: true ,
    //   channelId: channelId,
    //   message: newMessage,
    //   user: sentTo,
    //   invitees: [...collectInvitees]
    // };
  }

  @UseMiddleware(isAuth, loggerMiddleware)
  @Authorized("ADMIN", "OWNER", "MEMBER")
  @Mutation(() => Boolean)
  async addChannelMember(
    @Arg("userId", () => ID) userId: string,
    @Arg("channelId", () => String) channelId: string
  ) {
    const getUser = await User.createQueryBuilder("user")
      .where("user.id = :id", { id: userId })
      .getOne()
      .catch(err => {
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
      .catch(err => {
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
      .catch(err => {
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
        .catch(err => {
          deleteMember = "deletion error";
          console.error("Error deleting channel member", err);
        });
    }

    "deletion rejected";

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
      teamId
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
    console.log("AVOIDING TS UNUSED VARIABLE ERROR", teamId);
    const getMessages = await Channel.createQueryBuilder("channel")
      .leftJoinAndSelect("channel.messages", "messages")
      .leftJoinAndSelect("messages.sentBy", "sentBy")
      .where("channel.id = :channelId", { channelId })
      .getOne();

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
      .catch(error => new Error(error));

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
