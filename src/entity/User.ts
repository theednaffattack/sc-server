import {
  BaseEntity,
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  JoinTable,
  ManyToMany,
  ManyToOne
} from "typeorm";
import { Field, ID, ObjectType, Root } from "type-graphql";
import { registerEnumType } from "type-graphql";

import { Message } from "./Message";
import { Image } from "./Image";
import { Team } from "./Team";
import { Thread } from "./Thread";
import { TeamRoleEnum } from "./Role";
import { UserToTeam } from "./UserToTeam";

// import { teamMemberLoader } from "src/modules/utils/data-loaders/batch-team-members-loader";
import { Channel } from "./Channel";
import { UserToTeamIdReferencesOnlyClass } from "../modules/team/team-resolver";
import { FileEntity } from "./FileEntity";

registerEnumType(TeamRoleEnum, {
  name: "TeamRoleEnum", // this one is mandatory
  description: "admin | owner | member | public guest" // this one is optional
});

/**
 * User Entity (model)
 * @param {string} User.id - The ID of a User
 * @param {string} User.firstName - The given name of a User
 * @param {string} User.lastName - The family name (surname) of a User
 */
@ObjectType()
@Entity()
export class User extends BaseEntity {
  /**id field */
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

  // @Field(() => UserTeamRole)
  // @Column({
  //   type: "enum",
  //   enum: UserTeamRole,
  //   default: UserTeamRole.MEMBER
  // })
  // teamRole: UserTeamRole;

  // @Field(() => [Role])
  // @ManyToMany(
  //   () => Role,
  //   role => role.userForRole,
  //   { nullable: true }
  // )
  // @JoinTable()
  // teamRoles: Role[];

  @Field(() => Channel, { nullable: true })
  @ManyToOne(
    () => Channel,
    channel => channel.created_by,
    { nullable: true }
  )
  channels_created?: Channel;

  // () => User,
  // user => user.followers,
  // { nullable: true }
  // following: User[];

  @Field(() => [Image], { nullable: "itemsAndList" })
  @OneToMany(
    () => Image,
    image => image.user,
    { nullable: true }
  )
  images: Image[];

  @Field(() => [FileEntity], { nullable: "itemsAndList" })
  @OneToMany(
    () => FileEntity,
    file => file.upload_user,
    { nullable: true }
  )
  files: FileEntity[];

  @Field(() => [Message], { nullable: "itemsAndList" })
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
  @Field(() => [Team], { nullable: "itemsAndList" })
  @ManyToMany(() => Team)
  teams: Team[];

  @Field(() => [Thread], { nullable: true })
  @OneToMany(
    () => Thread,
    thread => thread.user
  )
  threads: Thread[];

  @Field(() => [Thread], { nullable: "itemsAndList" })
  @ManyToMany(
    () => Thread,
    thread => thread.invitees,
    { nullable: true }
  )
  @JoinTable()
  thread_invitations: Thread[];

  @Field(() => [Channel], { nullable: "itemsAndList" })
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

  @Field(() => [UserToTeam], { nullable: true })
  @OneToMany(
    () => UserToTeam,
    userToTeam => userToTeam.team
  )
  userToTeams: UserToTeam[];
}

@ObjectType()
export class UserClassTypeWithReferenceIds {
  /**id field */
  @Field(() => ID, { nullable: true })
  id: string;

  @Field({ nullable: true })
  firstName: string;

  @Field({ nullable: true })
  lastName: string;

  @Field({ nullable: true })
  email: string;

  @Field(() => Channel, { nullable: true })
  channels_created?: Channel;

  @Field(() => Image, { nullable: "itemsAndList" })
  images: Image[];

  @Field(() => [FileEntity], { nullable: "itemsAndList" })
  files: FileEntity[];

  @Field(() => [Message], { nullable: "itemsAndList" })
  mappedMessages: Message[];

  @Field(() => [User], { nullable: "itemsAndList" })
  followers: User[];

  @Field(() => [User], { nullable: "itemsAndList" })
  following: User[];

  // easier way of doing many-to-many
  @Field(() => [Team], { nullable: "itemsAndList" })
  teams: Team[];

  @Field(() => [Thread], { nullable: true })
  threads: Thread[];

  @Field(() => [Thread], { nullable: "itemsAndList" })
  thread_invitations: Thread[];

  @Field(() => [Channel], { nullable: "itemsAndList" })
  channel_memberships: Channel[];

  @Field({ nullable: true })
  profileImageUri: string;

  @Field({ nullable: true })
  name(@Root() parent: User): string {
    return `${parent.firstName} ${parent.lastName}`;
  }

  @Field()
  team_ownership: string;

  @Column()
  password: string;

  @Column("bool", { default: false })
  confirmed: boolean;

  @Field(() => [Message], { nullable: true })
  messages?: Message[];

  @Field(() => [Message], { nullable: true })
  sent_messages: Message[];

  @Field(() => [UserToTeamIdReferencesOnlyClass], { nullable: true })
  userToTeams: UserToTeamIdReferencesOnlyClass[];
}
