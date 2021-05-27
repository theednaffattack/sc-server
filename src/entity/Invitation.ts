import { GraphQLEmailAddress } from "graphql-scalars";
import { Field, ID, ObjectType, registerEnumType } from "type-graphql";
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

import { Team } from "./Team";

/** Invitation to Team via email status */
export enum InvitationStatusEnum {
  /** ACCEPTED */
  ACCEPTED = "ACCEPTED",
  /** PENDING */
  PENDING = "PENDING",
  /** ACCEPT_ERROR */
  ACCEPT_ERROR = "ACCEPT_ERROR",
  /** REISSUED */
  REISSUED = "REISSUED",
  /** REISSUED */
  RESCINDED = "RESCINDED",
  /** SENT */
  SENT = "SENT",
  /** UNSENT */
  UNSENT = "UNSENT",
}

registerEnumType(InvitationStatusEnum, {
  name: "InvitationStatusEnum", // this one is mandatory
  description: "admin | owner | member | public guest", // this one is optional
});

@ObjectType()
@Entity()
export class Invitation extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Field(() => GraphQLEmailAddress)
  @Column("citext")
  email: string;

  @Field(() => ID)
  @Column()
  teamId: string;

  @Field(() => Team)
  @ManyToOne(() => Team, (team) => team.invitations, {
    nullable: true,
    onDelete: "CASCADE",
  })
  team: Team;

  @Field(() => InvitationStatusEnum, { nullable: false })
  @Column({
    type: "enum",
    enum: [
      InvitationStatusEnum.ACCEPTED,
      InvitationStatusEnum.ACCEPT_ERROR,
      InvitationStatusEnum.PENDING,
      InvitationStatusEnum.REISSUED,
      InvitationStatusEnum.SENT,
      InvitationStatusEnum.UNSENT,
    ],
    array: false,
    default: InvitationStatusEnum.UNSENT,
  })
  status: InvitationStatusEnum;

  @Field(() => Date, { nullable: true })
  @CreateDateColumn({ type: "timestamp" })
  created_at: Date;

  @Field(() => Date, { nullable: true })
  @UpdateDateColumn({ type: "timestamp", nullable: true })
  updated_at?: Date;
}
