import { Field, InputType } from "type-graphql";
import { PasswordInput } from "../../shared/PasswordInput";

@InputType()
export class ChangePasswordInput extends PasswordInput {
  @Field({ nullable: true })
  token?: string;
}
