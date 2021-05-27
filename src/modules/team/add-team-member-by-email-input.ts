import { IsEmail } from "class-validator";
import { Field, ID, InputType } from "type-graphql";
import { TeamRoleEnum } from "../../entity/Role";

// import { PasswordInput } from "../../shared/PasswordInput";

@InputType()
export class AddTeamMemberByEmailInput {
  @Field(() => String)
  @IsEmail()
  email?: string;

  @Field(() => [TeamRoleEnum])
  teamRoles?: TeamRoleEnum[];

  @Field(() => ID)
  teamId: string;
}

@InputType()
export class InviteTeamMemberInput {
  @Field(() => String)
  @IsEmail()
  email: string;

  @Field(() => [TeamRoleEnum])
  teamRoles?: TeamRoleEnum[];

  @Field(() => ID)
  teamId: string;
}
