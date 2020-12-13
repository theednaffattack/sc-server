import { AuthChecker } from "type-graphql";
import { inspect } from "util";

import { MyContext } from "../../types/MyContext";
import { UserToTeam } from "../../entity/UserToTeam";
import { parseArgs } from "./parse-args";

enum AuthorizationStatus {
  SKIP_AUTH = "SKIP_AUTH",
  PERFORM_AUTH = "PERFORM_AUTH",
}

export const customAuthChecker: AuthChecker<MyContext> = async (
  { args, context, info },
  roles
): Promise<boolean> => {
  const shouldAuthorizationBePerformed = info.fieldName.includes(
    "getAllTeamsForUser"
  )
    ? AuthorizationStatus.SKIP_AUTH
    : AuthorizationStatus.PERFORM_AUTH;

  if (shouldAuthorizationBePerformed === AuthorizationStatus.SKIP_AUTH) {
    return true;
  }

  const getJoinedRelations = await UserToTeam.createQueryBuilder("userToTeam")
    .select()
    .where("userToTeam.userId = :userId", { userId: context.userId })
    .getMany()
    .catch((error) => {
      throw Error(
        `Error loading UserToTeam\n${inspect(error, false, 4, true)}`
      );
    });

  if (shouldAuthorizationBePerformed === AuthorizationStatus.PERFORM_AUTH) {
    return (
      parseArgs(args, info).teamId ===
        getJoinedRelations.filter(
          ({ teamId }) => teamId === parseArgs(args, info).teamId
        )[0].teamId &&
      context.userId ===
        getJoinedRelations.filter(
          ({ teamId }) => teamId === parseArgs(args, info).teamId
        )[0].userId &&
      examineFetchReturn(
        getJoinedRelations,
        roles,
        parseArgs(args, info).teamId,
        info
      )
    );
  }
  return true;
};

function findDuplicates(data: any) {
  let sortedData = data
    .slice()
    .sort((a: any, b: any) => (a.teamId > b.teamId ? 1 : -1));
  let duplicateResults = [];
  for (let i = 0; i < sortedData.length - 1; i++) {
    if (sortedData[i + 1].teamId === sortedData[i].teamId) {
      duplicateResults.push(sortedData[i]);
    }
  }
  return duplicateResults;
}

function examineFetchReturn(
  data: any[],
  roles: string[],
  teamId: any,
  info: any
): boolean {
  const dupeLength = findDuplicates(data).length;

  if (dupeLength > 0) {
    throw Error(
      `A duplicate permission group was found for this user for Team ID(s): ${findDuplicates(
        data
      ).map((dupe) => dupe.teamId)}, while running ${
        info.fieldName
      }  See your Admin about remediation.`
    );
  }

  const findDataForThisTeamId = data.filter((item) => {
    return item.teamId === teamId;
  });

  const isRoleAllowed = findDataForThisTeamId[0].teamRoleAuthorizations.some(
    (role: any) => roles.includes(role)
  );

  return isRoleAllowed;
}
