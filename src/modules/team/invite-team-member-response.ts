import { ObjectType, Field } from "type-graphql";

import { FieldError } from "../../lib/gql-type.field-error";
import { Invitation } from "../../entity/Invitation";

@ObjectType()
export class InviteTeamMemberResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => Invitation, { nullable: true })
  invitation?: Partial<Invitation>;
}
