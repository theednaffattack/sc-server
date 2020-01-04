import {
  BaseEntity,
  Entity,
  PrimaryGeneratedColumn,
  OneToMany,
  // ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  // ManyToMany,
  Column,
  ManyToMany
} from "typeorm";
import { Field, ID, ObjectType, Int } from "type-graphql";

// import { User } from "./User";
import { Message } from "./Message";
import { Team } from "./Team";
import { User } from "./User";

@ObjectType()
@Entity()
export class Channel extends BaseEntity {
  @Field(() => ID, { nullable: true })
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Field()
  @Column({ nullable: false })
  name: string;

  @Field(() => [Message], { nullable: "itemsAndList" })
  @OneToMany(
    () => Message,
    message => message.channel
  )
  messages?: Message[];

  @Field(() => String, { nullable: true })
  @Column({ nullable: true })
  last_message?: string;

  @Field(() => Int)
  message_count?: number;

  @Field(() => Boolean, {
    nullable: true,
    description:
      "Determines whether this channel is viewable to the public. (default = false)"
  })
  @Column({ default: false })
  public?: boolean;

  @Field()
  @OneToMany(
    () => Team,
    team => team.channels
  )
  team: Team;

  @Field(() => [User], { nullable: false })
  @ManyToMany(
    () => User,
    user => user.channel_memberships
  )
  invitees: User[];

  @Field(() => Date, { nullable: true })
  @CreateDateColumn({ type: "timestamp" })
  created_at: Date;

  @Field(() => Date, { nullable: true })
  @UpdateDateColumn({ type: "timestamp", nullable: true })
  updated_at?: Date;
}
