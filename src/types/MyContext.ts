import { NextFunction, Request, Response } from "express";
import { GraphQLResolveInfo, GraphQLArgs } from "graphql";
import { UserToTeam } from "../entity/UserToTeam";
import { User } from "../entity/User";
// import DataLoader = require("dataloader");

interface GraphQlInputs {
  args: GraphQLArgs;
  info: GraphQLResolveInfo;
}

interface TokenPayload {
  userId: string;
  iat: number;
  exp: number;
}

export interface MyContext {
  userId: User["id"];
  userTeam?: UserToTeam;
  gqlOpts: GraphQlInputs;
  req: Request;
  res: Response;
  next: NextFunction;
  usersLoader?: any;
  payload?: { token?: TokenPayload; errors?: any[] };
}
