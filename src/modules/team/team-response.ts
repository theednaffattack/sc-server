import { ObjectType, Field } from "type-graphql";

import { FieldError } from "../../lib/gql-type.field-error";
import { UttData } from "../../lib/gql-type.utt-data";

@ObjectType()
export class TeamResponse {
  @Field(() => FieldError, { nullable: true })
  errors?: FieldError[];

  @Field(() => UttData, { nullable: true })
  uttData?: UttData;
}
