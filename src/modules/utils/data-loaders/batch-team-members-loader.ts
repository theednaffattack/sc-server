import DataLoader from "dataloader";
// import { ObjectType } from "type-graphql";

import { Team } from "../../../entity/Team";
import { User } from "../../../entity/User";

// @ObjectType()
// class TeamMemberList {}

async function batchFunction(teamIds: string[]) {
  console.log("VIEW TEAM ID'S", teamIds);
  const results = await Team.createQueryBuilder("team")
    .leftJoinAndSelect("team.members", "member")
    .where("team.id IN (:...teamIds)", {
      teamIds: teamIds // <-- whaaaa???? why is it an array of an array?
    })
    .getMany();

  console.log("VIEW RESULTS", results);

  const teamIdToMembers: { [key: string]: User[] } = {};

  results.forEach(team => {
    if (team.id in teamIdToMembers) {
      teamIdToMembers[team.id] = [...teamIdToMembers[team.id], ...team.members];
    } else {
      teamIdToMembers[team.id] = [...team.members];
    }
  });

  // console.log("INSIDE BATCH FUNCTION (TEAM MEMBERS)", {
  //   return: teamIds.map((teamId: string) => teamIdToMembers[teamId]),
  //   teamIds,
  //   teamIdToMembers,
  //   results,
  //   finalResult: teamIds[0].map((teamId: string) => {
  //     console.log({ teamId, memberCorrellation: teamIdToMembers[teamId] });
  //     return teamIdToMembers[teamId];
  //   })
  // });

  const whatImReturning = teamIds.map((teamId: string) => {
    // console.log({ teamId, memberCorrellation: teamIdToMembers[teamId] });
    return teamIdToMembers[teamId];
  });

  const shapeReturnBetter = teamIds.map((id: string) => {
    let finalMembers: User[] = [];
    finalMembers = [...finalMembers, ...teamIdToMembers[id]];
    return finalMembers;
  });

  console.log("WHAT I'M RETURNING", {
    whatImReturning,
    teamIdToMembers,
    shapeReturnBetter
  });

  return results.map(team => team.members); //.map(team => team.id);
  // return whatImReturning;
  // return teamIdToMembers;
}

// @ts-ignore
export const teamMemberLoader = new DataLoader(batchFunction);
