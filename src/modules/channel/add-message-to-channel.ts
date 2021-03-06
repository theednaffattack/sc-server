import {
  Args,
  Resolver,
  Ctx,
  Mutation,
  Field,
  ObjectType,
  ID,
  Subscription,
  ResolverFilterData,
  Root,
  Arg,
} from "type-graphql";

import { MyContext } from "../../types/MyContext";
import { Channel } from "../../entity/Channel";
import { Message } from "../../entity/Message";
import { User } from "../../entity/User";
import { Image } from "../../entity/Image";
import { DataAddMessageToChannelInput } from "./channel-resolver";
import { createFile } from "./channel-helpers/create-file";
import { createMessageWithoutFile } from "./channel-helpers/create-message-without-file";

import { AddMessageToChannelInput } from "./add-message-to-channel-input";

export interface IAddMessagePayload {
  success: boolean;
  channelId: string;
  message: Message;
  user: User;
  invitees?: User[];
}

@ObjectType()
export class AddMessagePayload {
  @Field(() => Boolean)
  success: boolean;

  @Field(() => ID)
  channelId: string;

  @Field(() => Message)
  message: Message;

  @Field(() => User)
  user: User;

  @Field(() => [User], { nullable: "itemsAndList" })
  invitees?: User[];
}

@Resolver()
export class AddMessageToChannelResolver {
  @Subscription(() => AddMessagePayload, {
    topics: ({ context }: any) => {
      if (!context.userId) {
        throw new Error("Not authorized for this topic");
      }

      return "THREADS";
    },

    filter: ({
      payload,
      args,
    }: ResolverFilterData<
      IAddMessagePayload,
      DataAddMessageToChannelInput
    >) => {
      // filter for followers;
      const messageMatchesChannel = args.data.channelId === payload.channelId;

      if (messageMatchesChannel) {
        return true;
      } else {
        return false;
      }
    },
  })
  channelMessages(
    @Root() channelPayload: AddMessagePayload,
    @Arg("data", () => AddMessageToChannelInput)
    input: AddMessageToChannelInput
  ): AddMessagePayload {
    console.log("forced to use input".toUpperCase(), Object.keys(input));

    return channelPayload; // createdAt: new Date()
  }

  @Mutation(() => AddMessagePayload)
  async addMessageToChannel(
    @Ctx() context: MyContext,
    @Args(() => AddMessageToChannelInput) input: AddMessageToChannelInput
    // @PubSub("THREADS") publish: Publisher<AddMessagePayload>
  ): Promise<IAddMessagePayload> {
    console.log("CHECK ADD MESSAGE TO CHANNEL RESOLVER", input.teamId);
    const sentBy = await User.findOne(context.userId);

    const receiver = await User.findOne(input.invitees[0]);

    let existingChannel;
    let newMessage: any;

    if (
      sentBy !== undefined &&
      receiver !== undefined &&
      input.files &&
      input.files.length > 0
    ) {
      const returnObj = await createFile({
        channelId: input.channelId,
        files: input.files,
        message: input.message,
        receiver,
        sentBy,
      });
      console.log(
        "VIEW RETURN OBJECT INSIDE ADD MESSAGE TO CHANNEL (if files and sentBy and receiver === true)",
        { returnObj }
      );

      return returnObj;
    }

    if (
      (sentBy && receiver && input.images === undefined) ||
      (sentBy && receiver && input.files && input.files.length === 0)
    ) {
      // do stuff
      return createMessageWithoutFile({
        channelId: input.channelId,
        message: input.message,
        receiver,
        sentBy,
      });
    }

    if (sentBy && receiver && input.images && input.images[0]) {
      const newImageData: Image[] = input.images.map((image) =>
        Image.create({
          uri: `${image}`,
          user: sentBy,
        })
      );

      // save that image to the database
      let newImages = await Promise.all(
        newImageData.map(async (newImage) => await newImage.save())
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
        message: input.message,
        user: receiver,
        sentBy,
        images: [...newImages],
      };

      // CREATING rather than REPLYING to message...
      newMessage = await Message.create(createMessage).save();

      newImages.forEach(async (image) => {
        image.message = newMessage.id;
        await image.save();
        return image;
      });

      let existingChannel = await Channel.findOne(input.channelId, {
        relations: ["messages", "invitees", "messages.images"],
      }).catch((error) => error);

      const foundChannel = existingChannel && existingChannel.id ? true : false;

      existingChannel.last_message = input.message;

      console.log("VIEW EXISTING CHANNEL", { existingChannel });

      existingChannel.save();

      newMessage.channel = existingChannel;

      await newMessage.save();

      // let collectInvitees: any[] = [];

      // await Promise.all(
      //   input.invitees.map(async person => {
      //     let tempPerson = await User.findOne(person);
      //     collectInvitees.push(tempPerson);
      //     return tempPerson;
      //   })
      // );

      const returnObj = {
        success: existingChannel && foundChannel ? true : false,
        channelId: input.channelId,
        message: newMessage,
        user: receiver,
        // invitees: [...collectInvitees]
      };

      // await publish(returnObj).catch((error: Error) => {
      //   throw new Error(error.message);
      // });

      return returnObj;
    }

    if (
      (sentBy && receiver && input.images === undefined) ||
      (sentBy && receiver && input.images && input.images.length === 0)
    ) {
      let createMessageWithoutImage = {
        message: input.message,
        user: receiver,
        sentBy,
      };

      existingChannel = await Channel.findOne(input.channelId, {
        relations: ["messages", "invitees", "messages.images"],
      }).catch((error) => error);

      newMessage = await Message.create(createMessageWithoutImage).save();

      existingChannel.last_message = input.message;

      console.log("VIEW EXISTING CHANNEL", { existingChannel });

      await existingChannel.save();

      newMessage.channel = existingChannel;

      await newMessage.save();

      // let collectInvitees: User[] = [];

      // await Promise.all(
      //   input.invitees.map(async person => {
      //     let tempPerson = await User.findOne(person);
      //     if (tempPerson) {
      //       collectInvitees.push(tempPerson);
      //     }
      //     return tempPerson;
      //   })
      // );

      const returnObj = {
        success: existingChannel && existingChannel.id ? true : false,
        channelId: input.channelId,
        message: newMessage,
        user: receiver,
        // invitees: [...collectInvitees]
      };

      // await publish(returnObj);

      return returnObj;
    } else {
      throw Error(
        `unable to find sender or receiver / sender / image: ${sentBy}\nreceiver: ${receiver}`
      );
    }
  }
}
