import DataLoader from "dataloader";
// import { ObjectType } from "type-graphql";

import { Channel } from "../../../entity/Channel";
import { User } from "../../../entity/User";

// @ObjectType()
// class ChannelMemberList {}

async function batchFunction(channelIds: string[]) {
  console.log("VIEW TEAM ID'S", channelIds);
  const results = await Channel.createQueryBuilder("channel")
    .leftJoinAndSelect("channel.members", "member")
    .where("channel.id IN (:...channelIds)", {
      channelIds: channelIds // <-- whaaaa???? why is it an array of an array?
    })
    .getMany();

  console.log("VIEW RESULTS", results);

  const channelIdToMembers: { [key: string]: User[] } = {};

  results.forEach(channel => {
    if (channel.id in channelIdToMembers) {
      channelIdToMembers[channel.id] = [
        ...channelIdToMembers[channel.id],
        ...channel.invitees
      ];
    } else {
      channelIdToMembers[channel.id] = [...channel.invitees];
    }
  });

  // console.log("INSIDE BATCH FUNCTION (TEAM MEMBERS)", {
  //   return: channelIds.map((channelId: string) => channelIdToMembers[channelId]),
  //   channelIds,
  //   channelIdToMembers,
  //   results,
  //   finalResult: channelIds[0].map((channelId: string) => {
  //     console.log({ channelId, memberCorrellation: channelIdToMembers[channelId] });
  //     return channelIdToMembers[channelId];
  //   })
  // });

  const whatImReturning = channelIds.map((channelId: string) => {
    // console.log({ channelId, memberCorrellation: channelIdToMembers[channelId] });
    return channelIdToMembers[channelId];
  });

  const shapeReturnBetter = channelIds.map((id: string) => {
    let finalMembers: User[] = [];
    finalMembers = [...finalMembers, ...channelIdToMembers[id]];
    return finalMembers;
  });

  console.log("WHAT I'M RETURNING", {
    whatImReturning,
    channelIdToMembers,
    shapeReturnBetter
  });

  return results.map(channel => channel.invitees); //.map(channel => channel.id);
  // return whatImReturning;
  // return channelIdToMembers;
}

// @ts-ignore
export const channelMemberLoader = new DataLoader(batchFunction);
