import { Field, InputType, ID } from "type-graphql";
import { MinLength } from "class-validator";

// import { User } from "../../entity/User";

@InputType()
export class AddDirectMessageToThreadInput {
  @Field(() => ID)
  threadId: string;

  @Field(() => ID)
  teamId: string;

  @Field(() => String)
  @MinLength(3)
  message_text: string;

  @Field(() => [String])
  invitees: string[];
}
