import { Channel } from "../../../entity/Channel";
import { Message } from "../../../entity/Message";
import { User } from "../../../entity/User";

import {
  FileEntity,
  // FileTypeEnum,
  FileInputHelper
} from "../../../entity/FileEntity";

interface CreateFileProps {
  channelId: string;
  files: FileInputHelper[];
  message: string;
  receiver: User;
  sentBy: User;
}

export async function createFile({
  channelId,
  files,
  message,
  receiver,
  sentBy
}: CreateFileProps) {
  // let existingChannel: any;
  // let newMessage: any;

  const newFileData: FileEntity[] = files.map(file =>
    FileEntity.create({
      uri: file.uri,
      upload_user: sentBy,
      file_type: file.file_type
    })
  );

  // save that file to the database
  let newFiles = await Promise.all(
    newFileData.map(async newFile => await newFile.save())
  );

  // add the files to the user.files
  // field / column
  if (newFiles !== null && newFiles.length && newFiles.length > 0) {
    if (!sentBy.files || (sentBy.files && sentBy.files.length === 0)) {
      sentBy.files = [...newFiles];
    }
    if (sentBy.files && sentBy.files.length && sentBy.files.length > 0) {
      sentBy.files = [...sentBy.files, ...newFiles];
    }
  }

  let createMessage = {
    message: message,
    user: receiver,
    sentBy,
    files: [...newFiles]
  };

  // CREATING rather than REPLYING to message...
  const newMessage = await Message.create(createMessage).save();
  // .then(data => data)
  // .catch(error => {
  //   console.error(`Error creating new message ${error.message}`);
  // });

  newFiles.forEach(async file => {
    file.message = newMessage;
    await file.save();
    return file;
  });

  let existingChannel = await Channel.findOne(channelId, {
    relations: ["messages", "invitees", "messages.images"]
  }).catch(error => error);

  const foundChannel = existingChannel && existingChannel.id ? true : false;

  existingChannel.last_message = message;

  console.log("VIEW EXISTING CHANNEL", { existingChannel });

  existingChannel.save();

  newMessage.channel = existingChannel;

  let whaat = await newMessage.save();

  // let collectInvitees: any[] = [];

  // await Promise.all(
  //   input.invitees.map(async person => {
  //     let tempPerson = await User.findOne(person);
  //     collectInvitees.push(tempPerson);
  //     return tempPerson;
  //   })
  // );
  console.log("INSIDE CREAE FILE AFTER NEW MESSAGE SAVE", { whaat });
  const returnObj = {
    success: existingChannel && foundChannel ? true : false,
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
