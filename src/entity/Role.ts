import {
  BaseEntity,
  Entity,
  PrimaryGeneratedColumn,
  Column
  // ManyToMany
} from "typeorm";
import { Field, ID, ObjectType, registerEnumType } from "type-graphql";

// import { User } from "./User";
// import { Team } from "./Team";

/** Basic User Roles */
export enum TeamRoleEnum {
  /** ADMIN */
  ADMIN = "ADMIN",
  /** OWNER */
  OWNER = "OWNER",
  /** MEMBER */
  MEMBER = "MEMBER",
  /** PUBLIC_GUEST */
  PUBLIC_GUEST = "PUBLIC_GUEST"
}

registerEnumType(TeamRoleEnum, {
  name: "TeamRoleEnum", // this one is mandatory
  description: "admin | owner | member | public guest" // this one is optional
});

@ObjectType()
@Entity()
export class Role extends BaseEntity {
  @Field(() => ID, { nullable: true })
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Field(() => [TeamRoleEnum], { nullable: false })
  @Column({
    type: "enum",
    enum: [
      TeamRoleEnum.ADMIN,
      TeamRoleEnum.MEMBER,
      TeamRoleEnum.OWNER,
      TeamRoleEnum.PUBLIC_GUEST
    ],
    array: true,
    default: [TeamRoleEnum.MEMBER]
  })
  teamRoleAuthorizations: TeamRoleEnum[];

  // @Field(() => User)
  // @ManyToMany(
  //   () => User,
  //   user => user.teamRoles,
  //   { nullable: true }
  // )
  // userForRole: User;

  // @Field(() => [Team], { nullable: true })
  // @ManyToMany(
  //   () => Team,
  //   team => team.teamRoles,
  //   { nullable: true }
  // )
  // teamForRole: Team[];
}
