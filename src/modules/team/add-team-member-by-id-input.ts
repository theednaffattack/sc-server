import { Field, ID, InputType } from "type-graphql";
import { TeamRoleEnum } from "../../entity/Role";

// import { PasswordInput } from "../../shared/PasswordInput";

@InputType()
export class AddTeamMemberByIdInput {
  @Field(() => String)
  userId?: string;

  @Field(() => [TeamRoleEnum])
  teamRoles?: TeamRoleEnum[];

  @Field(() => ID)
  teamId: string;
}
