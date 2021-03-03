import { NextFunction, Request, Response } from "express";
import { GraphQLResolveInfo, GraphQLArgs } from "graphql";
import { User } from "../entity/User";
// import DataLoader = require("dataloader");

interface GraphQlInputs {
  args: GraphQLArgs;
  info: GraphQLResolveInfo;
}

export interface MyContext {
  userId: User["id"];
  gqlOpts: GraphQlInputs;
  req: Request;
  res: Response;
  next: NextFunction;
  usersLoader?: any;
  payload?: { userId: string };
}
