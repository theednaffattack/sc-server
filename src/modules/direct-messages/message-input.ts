import { Field, ObjectType, ArgsType, InputType } from "type-graphql";

@ArgsType()
export class MessageFromUserInput {
  // @ts-ignore
  @Field(type => String)
  sentTo: string;

  @Field(() => String)
  message: string;
}

@InputType()
export class GetMessagesFromUserInput {
  // @ts-ignore
  @Field(type => String)
  sentBy: string;
  // @ts-ignore
  @Field(type => String)
  user: string;
}

@InputType()
export class GetAllMyMessagesInput {
  // @ts-ignore
  @Field(type => String)
  user: string;
}

@ObjectType()
export class MessageOutput {
  @Field()
  message: string;
}
