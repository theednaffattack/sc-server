import { Field, ID, InputType } from "type-graphql";

@InputType()
export class AddMessageToChannelInput {
  @Field(() => ID)
  channelId: string;

  @Field(() => ID)
  teamId: string;

  @Field(() => String)
  sentTo: string;

  @Field(() => [ID], { nullable: "itemsAndList" })
  invitees?: string[];

  @Field(() => String)
  message: string;

  @Field(() => [String], { nullable: "itemsAndList" })
  images: string[];
}
