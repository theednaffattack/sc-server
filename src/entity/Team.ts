import {
  BaseEntity,
  Entity,
  PrimaryGeneratedColumn,
  Column,
  JoinTable,
  // OneToMany,
  ManyToMany,
  ManyToOne
} from "typeorm";
import { Field, ID, ObjectType, Ctx } from "type-graphql";

// import { UserTeam } from "./UserTeam";
import { User } from "./User";
import { MyContext } from "../types/MyContext";
import { Channel } from "./Channel";

@ObjectType()
@Entity()
export class Team extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Field(() => String)
  @Column()
  name: string;

  @Field(() => User)
  @ManyToOne(
    () => User,
    user => user.team_ownership
  )
  owner: User;

  @Field(() => [Channel])
  @ManyToOne(
    () => Channel,
    channel => channel.team
  )
  channels: [Channel];

  // @OneToMany(
  //   () => UserTeam,
  //   user => user.team,
  //   { nullable: true }
  // )
  // @JoinTable()
  // userConnection: Promise<UserTeam[]>;

  // easier way of doing many-to-many
  @ManyToMany(() => User)
  @JoinTable()
  members: User[];

  @Field(() => [User])
  async membersLoader(@Ctx() { usersLoader }: MyContext): Promise<User[]> {
    return usersLoader.load(this.id);
  }
}
