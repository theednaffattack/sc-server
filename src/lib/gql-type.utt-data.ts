import { ObjectType, Field } from "type-graphql";

@ObjectType()
export class UttData {
  @Field()
  name: string;

  @Field()
  teamId: string;

  @Field()
  userId: string;

  @Field()
  userToTeamId: string;
}
