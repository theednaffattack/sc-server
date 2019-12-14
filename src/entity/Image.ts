import {
  BaseEntity,
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne
} from "typeorm";
import { Field, ID, ObjectType } from "type-graphql";

import { User } from "./User";
import { Message } from "./Message";

@ObjectType()
@Entity()
export class Image extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Field()
  @Column()
  uri: string;

  @Field(() => Message, { nullable: true })
  @ManyToOne(
    () => Message,
    message => message.images,
    { nullable: true }
  )
  message?: Message;

  @Field(() => User)
  @ManyToOne(
    () => User,
    user => user.images
  )
  user: User;

  // @Field(() => Post)
  // @ManyToOne(
  //   () => Post,
  //   post => post.images
  // )
  // post: Post;
}
