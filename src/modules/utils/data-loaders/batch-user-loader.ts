import Dataloader from "dataloader";
// import { In } from "typeorm";

import { User } from "../../../entity/User";
import { Team } from "../../../entity/Team";

const batchUsers = async (userIds: any) => {
  console.log("batchUsers - VIEW USER ID'S", userIds);
  const members = await Team.createQueryBuilder("team")
    .leftJoinAndSelect("team.members", "member")
    .where("member.id IN (:...userIds)", { userIds })
    .getMany();

  // const userTeams = await UserTeam.find({
  //   join: {
  //     alias: "userTeam",
  //     innerJoinAndSelect: {
  //       user: "userTeam.member"
  //     }
  //   },
  //   where: {
  //     teamId: In(userIds)
  //   }
  // });

  const teamIdToMembers: { [key: string]: User[] } = {};

  // Example:
  // {
  //   userId: "sdkfjsajfkajf",
  //   teamId: "sdfjdisjfi9if9sdfv",
  //   __member__: {id: "lskdfjdskf", name: "member1"}
  // }

  console.log("DATA LOADER: BATCH USER LOADER RETURNING...", {
    what: userIds.map((userId: any) => teamIdToMembers[userId]),
    members: members
  });

  members.forEach(ut => {
    if (ut.id in teamIdToMembers) {
      teamIdToMembers[ut.id].push((ut as any).__member__);
    } else {
      teamIdToMembers[ut.id] = [(ut as any).__member__];
    }
  });

  console.log("DATA LOADER: BATCH USER LOADER RETURNING...", {
    what: userIds.map((userId: any) => teamIdToMembers[userId]),
    members: members,
    teamIdToMembers
  });

  return userIds.map((userId: any) => teamIdToMembers[userId]);
};

export const createUsersLoader = () => {
  console.log("LOAD NEW DATALOADER");
  // const userLoader = new DataLoader(keys => myBatchGetUsers(keys));
  return new Dataloader(batchUsers);
};
