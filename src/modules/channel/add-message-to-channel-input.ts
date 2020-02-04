import { Field, ID, InputType } from "type-graphql";

@InputType()
export class AddMessageToChannelInput {
  // @ts-ignore
  @Field(type => ID)
  channelId: string;

  // @ts-ignore
  @Field(type => String)
  sentTo: string;

  @Field(() => [ID], { nullable: "itemsAndList" })
  invitees?: string[];

  // @ts-ignore
  @Field(type => String)
  message: string;

  @Field(() => [String], { nullable: "itemsAndList" })
  images: string[];
}
