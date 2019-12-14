import {
  BaseEntity,
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  JoinTable,
  ManyToMany
} from "typeorm";
import { Field, ID, ObjectType, Root } from "type-graphql";
import { Message } from "./Message";
import { Image } from "./Image";

@ObjectType()
@Entity()
export class User extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Field()
  @Column()
  firstName: string;

  @Field()
  @Column()
  lastName: string;

  @Field()
  @Column("text", { unique: true })
  email: string;

  @Field(() => Image, { nullable: "itemsAndList" })
  @OneToMany(
    () => Image,
    image => image.user,
    { nullable: true }
  )
  images: Image[];

  @Field(() => [Message])
  mappedMessages: Message[];

  @Field(() => [User], { nullable: "itemsAndList" })
  @ManyToMany(
    () => User,
    user => user.following,
    { nullable: true }
  )
  @JoinTable()
  followers: User[];

  @Field(() => [User], { nullable: "itemsAndList" })
  @ManyToMany(
    () => User,
    user => user.followers,
    { nullable: true }
  )
  following: User[];

  @Field({ nullable: true })
  @Column("text", { unique: true, nullable: true })
  profileImageUri: string;

  @Field()
  name(@Root() parent: User): string {
    return `${parent.firstName} ${parent.lastName}`;
  }

  @Column()
  password: string;

  @Column("bool", { default: false })
  confirmed: boolean;

  @Field(() => [Message], { nullable: true })
  @OneToMany(
    () => Message,
    message => message.user
  )
  messages?: Message[];

  @Field(() => [Message], { nullable: true })
  @OneToMany(
    () => Message,
    message => message.sentBy
  )
  sent_messages: Message[];
}
