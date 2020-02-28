import delve from "dlv";
// import { inspect } from "util";
import { GraphQLResolveInfo } from "graphql";

interface ParseArgsValues {
  teamId: string | null;
  channelId: string | null;
}

export function parseArgs(
  inputArgs: any,
  info: GraphQLResolveInfo
): ParseArgsValues {
  console.log("VIEW ARGS", { inputArgs });
  const getKeys = Object.keys(inputArgs);
  const teamIdIsPresentAndTopLevelKey: boolean = getKeys.includes("teamId");

  let returnObject = {
    teamId: null,
    channelId: null
  };
  // IF KEY IS TOP-LEVEL
  if (teamIdIsPresentAndTopLevelKey) {
    returnObject.teamId = inputArgs.teamId;
    returnObject.channelId = inputArgs.channelId;

    return returnObject;
  }
  // IF KEY IS NESTED BENEATH "DATA"
  if (delve(inputArgs, "data.teamId")) {
    returnObject.teamId = delve(inputArgs, "data.teamId");
    returnObject.channelId = delve(inputArgs, "data.channelId");

    return returnObject;
  }
  // IF KEY IS NESTED BENEATH "INPUT"
  if (delve(inputArgs, "input.teamId")) {
    returnObject.teamId = delve(inputArgs, "input.teamId");
    returnObject.channelId = delve(inputArgs, "input.channelId");

    return returnObject;
  }
  throw Error(`error parsing input for ${info.fieldName}`);
}
