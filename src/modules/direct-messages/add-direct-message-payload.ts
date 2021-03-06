import { ObjectType, Field, ID } from "type-graphql";

import { Message } from "../../entity/Message";
import { User } from "../../entity/User";

@ObjectType()
export class AddDirectMessagePayload {
  @Field(() => Boolean)
  success: boolean;

  @Field(() => ID)
  threadId: string;

  @Field(() => Message)
  message: Message;

  @Field(() => User)
  sentBy: User;

  @Field(() => [User])
  invitees: User[];
}
