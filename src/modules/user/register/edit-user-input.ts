import { Length, IsEmail } from "class-validator";
import { Field, InputType } from "type-graphql";
// import { PasswordInput } from "../../shared/PasswordInput";

@InputType()
export class EditUserInput {
  @Field()
  @Length(1, 255)
  firstName: string;

  @Field()
  @Length(1, 255)
  lastName: string;

  @Field()
  @IsEmail()
  email?: string;
}
