import { Field, ID, InputType } from "type-graphql";
import { MinLength } from "class-validator";

@InputType()
export class AddChannelInput {
  @Field(() => ID)
  teamId: string;

  @Field(() => String)
  @MinLength(3)
  name: string;
}
