import { Channel } from "../../../entity/Channel";
import { Message } from "../../../entity/Message";
import { User } from "../../../entity/User";

interface CreateMessageWithoutFileProps {
  channelId: string;
  message: string;
  receiver: User;
  sentBy: User;
}

export async function createMessageWithoutFile({
  channelId,
  message,
  receiver,
  sentBy
}: CreateMessageWithoutFileProps) {
  // let existingChannel: any;
  // let newMessage: any;

  let createMessage = {
    message: message,
    user: receiver,
    sentBy
  };

  // CREATING rather than REPLYING to message...
  const newMessage: any = await Message.create(createMessage).save();

  let existingChannel = await Channel.findOne(channelId, {
    relations: ["messages", "invitees", "messages.images"]
  }).catch(error => error);

  const foundChannel = existingChannel && existingChannel.id ? true : false;

  existingChannel.last_message = message;

  console.log("VIEW EXISTING CHANNEL", { existingChannel });

  existingChannel.save();

  newMessage.channel = existingChannel;

  await newMessage.save();

  const returnObj = {
    success: existingChannel && foundChannel ? true : false,
    channelId: channelId,
    message: newMessage,
    user: receiver
  };

  // await publish(returnObj).catch((error: Error) => {
  //   throw new Error(error.message);
  // });

  return returnObj;
}

// let createMessage = {
//   message: input.message,
//   user: receiver,
//   sentBy
// };

// existingChannel = await Channel.findOne(input.channelId, {
//   relations: ["messages", "invitees", "messages.images"]
// }).catch(error => error);

// newMessage = await Message.create(createMessage).save();

// existingChannel.last_message = input.message;

// console.log("VIEW EXISTING CHANNEL", { existingChannel });

// await existingChannel.save();

// newMessage.channel = existingChannel;

// await newMessage.save();

// // let collectInvitees: User[] = [];

// // await Promise.all(
// //   input.invitees.map(async person => {
// //     let tempPerson = await User.findOne(person);
// //     if (tempPerson) {
// //       collectInvitees.push(tempPerson);
// //     }
// //     return tempPerson;
// //   })
// // );

// const returnObj = {
//   success: existingChannel && existingChannel.id ? true : false,
//   channelId: input.channelId,
//   message: newMessage,
//   user: receiver
//   // invitees: [...collectInvitees]
// };
