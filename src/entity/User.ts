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
// import { UserTeam } from "./UserTeam";
import { Team } from "./Team";
import { Thread } from "./Thread";
// import { Channel } from "./Channel";

export enum UserTeamRole {
  ADMIN = "admin",
  OWNER = "owner",
  MEMBER = "member"
}

import { registerEnumType } from "type-graphql";
// import { teamMemberLoader } from "src/modules/utils/data-loaders/batch-team-members-loader";
import { Channel } from "./Channel";

registerEnumType(UserTeamRole, {
  name: "UserTeamRole", // this one is mandatory
  description: "admin | owner | member" // this one is optional
});

@ObjectType()
@Entity()
export class User extends BaseEntity {
  @Field(() => ID, { nullable: true })
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Field({ nullable: true })
  @Column()
  firstName: string;

  @Field({ nullable: true })
  @Column()
  lastName: string;

  @Field({ nullable: true })
  @Column("text", { unique: true })
  email: string;

  @Field(() => UserTeamRole)
  @Column({
    type: "enum",
    enum: UserTeamRole,
    default: UserTeamRole.MEMBER
  })
  teamRole: UserTeamRole;

  // () => User,
  // user => user.followers,
  // { nullable: true }
  // following: User[];

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

  // easier way of doing many-to-many
  @ManyToMany(() => Team)
  teams: Team[];

  @Field(() => [Thread], { nullable: true })
  @OneToMany(
    () => Thread,
    thread => thread.user
  )
  threads: Thread[];

  // @ts-ignore
  @Field(type => [Thread], { nullable: "itemsAndList" })
  // @ts-ignore
  @ManyToMany(
    () => Thread,
    thread => thread.invitees,
    { nullable: true }
  )
  @JoinTable()
  thread_invitations: Thread[];

  @Field(() => [Thread], { nullable: "itemsAndList" })
  @ManyToMany(
    () => Channel,
    channel => channel.invitees,
    { nullable: true }
  )
  @JoinTable()
  channel_memberships: Channel[];

  @Field({ nullable: true })
  @Column("text", { unique: true, nullable: true })
  profileImageUri: string;

  @Field({ nullable: true })
  name(@Root() parent: User): string {
    return `${parent.firstName} ${parent.lastName}`;
  }

  @Field()
  @OneToMany(
    () => Team,
    team => team.owner
  )
  team_ownership: string;

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
