import {
  BaseEntity,
  Entity,
  PrimaryGeneratedColumn,
  Column,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany
} from "typeorm";
import { Field, ID, ObjectType } from "type-graphql";

import { User } from "./User";
import { Channel } from "./Channel";
import { Thread } from "./Thread";
import { UserToTeam } from "./UserToTeam";

@ObjectType()
@Entity()
export class Team extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Field(() => String)
  @Column({ unique: true })
  name: string;

  @Field(() => User)
  @ManyToOne(
    () => User,
    user => user.team_ownership
  )
  owner: User;

  // @Field(() => [Channel], { nullable: "itemsAndList" })
  // @ManyToOne(
  //   () => Channel,
  //   channel => channel.team
  // )
  // channels: [Channel];

  @Field(() => [Channel], { nullable: "items" })
  @OneToMany(
    () => Channel,
    channel => channel.team
  )
  channels: [Channel];

  @Field(() => [Thread], { nullable: "items" })
  @OneToMany(
    () => Thread,
    thread => thread.team
  )
  threads: [Thread];

  // @TODO: REMOVE "members"
  // easier way of doing many-to-many
  @Field(() => [User], { nullable: "items" })
  @ManyToMany(() => User)
  @JoinTable()
  members: User[];

  @Field(() => [UserToTeam], { nullable: "items" })
  @OneToMany(
    () => UserToTeam,
    userToTeams => userToTeams.user
  )
  userToTeams: UserToTeam[];
}
