import { Field, ID, InputType } from "type-graphql";
import { MinLength } from "class-validator";

import { User } from "../../entity/User";

@InputType()
export class AddDirectMessageInput {
  @Field(() => ID)
  threadId: string;

  @Field(() => String)
  @MinLength(3)
  message_text: string;

  @Field(() => [User])
  invitees: User[];
}
