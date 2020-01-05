import { AuthChecker } from "type-graphql";

import { MyContext } from "../../types/MyContext";
import { User } from "../../entity/User";
import { Team } from "../../entity/Team";

export const customAuthChecker: AuthChecker<MyContext> = async (
  { context },
  roles
): Promise<boolean> => {
  const { userId } = context;
  // here we can read the user from context
  // and check his permission in the db against the `roles` argument
  // that comes from the `@Authorized` decorator, eg. ["ADMIN", "MODERATOR"]
  const getUserRoles = await User.createQueryBuilder("user")
    .where("user.id = :userId", { userId })
    .getOne();

  const getUserRolesFromTeamEntity = await Team.createQueryBuilder("team")
    .leftJoinAndSelect("team.members", "member")
    .where("member.id = : userId", { userId })
    .andWhere("member.roles In :roles", { roles })
    .getOne();

  console.log({ getUserRoles, getUserRolesFromTeamEntity });

  if (getUserRoles && getUserRoles.teamRole) return true; // or false if access is denied
  return false;
};
