// import DataLoader = require("dataloader");
import DataLoader from "dataloader";
import { Team } from "../../../entity/Team";

async function batchFunction(teamIds: any) {
  const results = await Team.createQueryBuilder("team")

    .where("team.id IN (:...teamIds)", { teamIds })
    .getMany();

  return results; //.map(team => team.id);
}

export const exampleTeamLoader = new DataLoader(batchFunction);
