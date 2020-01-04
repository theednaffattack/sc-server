import {
  BaseEntity,
  Entity,
  Column,
  PrimaryColumn
  // ManyToOne,
  // JoinColumn
} from "typeorm";
import { Field, ID, ObjectType } from "type-graphql";
// import { User } from "./User";
// import { Team } from "./Team";

@ObjectType()
@Entity()
export class UserTeam extends BaseEntity {
  @Field(() => ID)
  @PrimaryColumn()
  userId: string;

  @Field(() => ID)
  @PrimaryColumn()
  teamId: string;

  @Field()
  @Column()
  name: string;

  // @Field(() => [User], { nullable: "itemsAndList" })
  // @ManyToOne(
  //   () => User,
  //   user => user.teamConnection,
  //   {
  //     primary: true,
  //     nullable: false
  //   }
  // )
  // @JoinColumn({ name: "userId" })
  // member: Promise<User>;

  // @Field(() => [User], { nullable: "itemsAndList" })
  // @ManyToOne(
  //   () => Team,
  //   team => team.userConnection,
  //   {
  //     primary: true,
  //     nullable: false
  //   }
  // )
  // @JoinColumn({ name: "teamId" })
  // team: Promise<Team>;
}
