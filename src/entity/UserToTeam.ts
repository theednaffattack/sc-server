import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  BaseEntity,
  ObjectType as ObjectTypeTypeOrm,
} from "typeorm";
import { Field, ID, ObjectType } from "type-graphql";

import { User } from "./User";
import { Team } from "./Team";
import { TeamRoleEnum } from "./Role";

@ObjectType()
@Entity()
export class UserToTeam extends BaseEntity {
  @Field(() => ID, { nullable: false })
  @PrimaryGeneratedColumn("uuid")
  userToTeamId: string;

  @Field(() => ID, { nullable: false })
  @Column()
  userId: string;

  @Field(() => ID, { nullable: false })
  @Column()
  teamId: string;

  @Field(() => [TeamRoleEnum], { nullable: false })
  @Column({
    type: "enum",
    enum: [
      TeamRoleEnum.ADMIN,
      TeamRoleEnum.MEMBER,
      TeamRoleEnum.OWNER,
      TeamRoleEnum.PUBLIC_GUEST,
    ],
    array: true,
    default: [TeamRoleEnum.MEMBER],
  })
  teamRoleAuthorizations: TeamRoleEnum[];

  @Field(() => User, { nullable: false })
  @ManyToOne((): ObjectTypeTypeOrm<User> => User, (user) => user.userToTeams, {
    onDelete: "CASCADE",
  })
  user: User;

  @Field(() => Team, { nullable: false })
  @ManyToOne(
    (): ObjectTypeTypeOrm<Team> => Team,
    ({ userToTeams }: Team): UserToTeam[] => userToTeams,
    { onDelete: "CASCADE" }
  )
  team: Team;
}
