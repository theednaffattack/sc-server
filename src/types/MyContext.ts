import { NextFunction, Request, Response } from "express";
import { GraphQLResolveInfo, GraphQLArgs } from "graphql";
import { User } from "src/entity/User";

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
}
