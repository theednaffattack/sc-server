import { Field, ID, InputType } from "type-graphql";

import { FileInputHelper } from "../../entity/FileEntity";

@InputType()
export class AddMessageToChannelInput {
  @Field(() => ID)
  channelId: string;

  @Field(() => ID)
  teamId: string;

  @Field(() => Date, { nullable: true })
  created_at: Date;

  @Field(() => String)
  sentTo: string;

  @Field(() => [ID], { nullable: "itemsAndList" })
  invitees?: string[];

  @Field(() => String)
  message: string;

  @Field(() => [String], { nullable: "itemsAndList" })
  images: string[];

  @Field(() => [FileInputHelper], { nullable: "itemsAndList" })
  files: FileInputHelper[];
}
