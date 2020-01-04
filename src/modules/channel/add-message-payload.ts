import { ObjectType, Field, ID } from "type-graphql";

import { Message } from "../../entity/Message";
import { User } from "../../entity/User";

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

  @Field(() => [User])
  invitees: User[];
}
