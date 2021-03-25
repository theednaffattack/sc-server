import { ObjectType, Field, ID } from "type-graphql";
import {
  ManyToOne,
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";

import { User } from "./User";
import { Image } from "./Image";
import { FileEntity } from "./FileEntity";
import { Channel } from "./Channel";
import { Thread } from "./Thread";

export interface MessagePayload {
  id: number;
  message?: string;
  created_at?: Date;
  updated_at?: Date;
  sentBy?: string;
  user?: User;
}

@ObjectType()
@Entity()
export class Message extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Field(() => Date, { nullable: true })
  @CreateDateColumn({ type: "timestamp" })
  created_at: Date;

  @Field(() => Date, { nullable: true })
  @UpdateDateColumn({ type: "timestamp", nullable: true })
  updated_at?: Date;

  @Field()
  @Column()
  message: string;

  // mappedMessages: [User];

  @Field(() => [Image], { nullable: "itemsAndList" })
  @OneToMany(() => Image, (image) => image.message, { nullable: true })
  images: Image[];

  @Field(() => [FileEntity], { nullable: "itemsAndList" })
  @OneToMany(() => FileEntity, (file) => file.message, { nullable: true })
  files: FileEntity[];

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.sent_messages, { cascade: true })
  sentBy: User;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.messages, { cascade: true })
  user: User;

  @Field(() => Channel, { nullable: true })
  @ManyToOne(() => Channel, (channel) => channel.messages)
  channel: Channel;

  @Field(() => Thread, { nullable: true })
  @ManyToOne(() => Thread, (thread) => thread.messages)
  thread: Thread;
}
