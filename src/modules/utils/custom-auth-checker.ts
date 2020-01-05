import { AuthChecker } from "type-graphql";

import { MyContext } from "../../types/MyContext";
import { User } from "../../entity/User";

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

  if (getUserRoles && roles.includes(getUserRoles.teamRole)) {
    console.log("AUTHORIZATION CHECKER MIDDLEWARE", {
      getUserRoles,
      roles,
      roleMatches: roles.includes(getUserRoles.teamRole),
      userId
    });
    return true;
  } // or false if access is denied
  return false;
};
