import { ObjectType, Field } from "type-graphql";

import { FieldError } from "../../lib/gql-type.field-error";
import { User } from "../../entity/User";

@ObjectType()
export class ChangePasswordResponse {
  @Field(() => FieldError, { nullable: true })
  errors?: FieldError[];

  @Field(() => User, { nullable: true })
  user?: User;
}
