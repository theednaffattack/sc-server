import {
  BaseEntity,
  Entity,
  PrimaryGeneratedColumn,
  OneToMany,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  Column,
} from "typeorm";
import { Field, ID, ObjectType, Int } from "type-graphql";

import { User } from "./User";
import { Message } from "./Message";
import { Team } from "./Team";
import { Channel } from "./Channel";

@ObjectType()
@Entity()
export class Thread extends BaseEntity {
  @Field(() => ID, { nullable: true })
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Field(() => [Message], { nullable: "itemsAndList" })
  @OneToMany(() => Message, (message) => message.thread)
  messages?: Message[];

  @Field(() => String, { nullable: true })
  @Column({ nullable: true })
  last_message?: string;

  @Field(() => Int)
  message_count?: number;

  @Field(() => User, { nullable: false })
  @ManyToOne(() => User, (user) => user.threads)
  user: User;

  @Field(() => Team, { nullable: true })
  @ManyToOne(() => Team, (team) => team.threads)
  team: Team;

  @Field(() => [User], { nullable: false })
  @ManyToMany(() => User, (user) => user.thread_invitations)
  invitees: User[];

  @Field(() => Channel, { nullable: true })
  @ManyToOne(() => Channel, (channel) => channel.threads)
  channel: Channel;

  @Field(() => Date, { nullable: true })
  @CreateDateColumn({ type: "timestamp" })
  created_at: Date;

  @Field(() => Date, { nullable: true })
  @UpdateDateColumn({ type: "timestamp", nullable: true })
  updated_at?: Date;
}
