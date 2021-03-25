import { ObjectType, Field, ID } from "type-graphql";

import { Message } from "../../entity/Message";
import { User } from "../../entity/User";

@ObjectType()
export class AddThreadPayload {
  @Field(() => Boolean)
  success: boolean;

  @Field(() => ID)
  channelId: string;

  @Field({ nullable: true })
  created_at: Date;

  @Field(() => ID)
  threadId: string;

  @Field(() => Message)
  message: Partial<Message>;

  @Field(() => User)
  sentBy: User;

  @Field(() => [User], { nullable: "itemsAndList" })
  invitees?: User[];
}
