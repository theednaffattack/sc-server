import { Length, IsEmail } from "class-validator";
import { Field, InputType, ID } from "type-graphql";

import { TeamRoleEnum } from "../../../entity/Role";
// import { PasswordInput } from "../../shared/PasswordInput";

@InputType()
export class EditUserInput {
  @Field(() => String)
  @Length(1, 255)
  firstName: string;

  @Field(() => String)
  @Length(1, 255)
  lastName: string;

  @Field(() => String)
  @IsEmail()
  email?: string;

  @Field(() => [TeamRoleEnum])
  teamRoles?: TeamRoleEnum[];

  @Field(() => ID)
  teamId: string;
}
