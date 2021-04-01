import { graphql, GraphQLSchema } from "graphql";
import { Maybe } from "type-graphql";
// import Maybe from "graphql/tsutils/Maybe";

import { createSchemaSync } from "../global-utils/createSchema";

interface Options {
  source: string;
  variableValues?: Maybe<{
    [key: string]: any;
  }>;
  userId?: string;
}

let schema: GraphQLSchema;

export const gCall = async ({ source, variableValues, userId }: Options) => {
  if (!schema) {
    schema = createSchemaSync;
  }
  return graphql({
    schema,
    source,
    variableValues,
    contextValue: {
      req: {
        session: {
          userId,
        },
      },
      res: {
        clearCookie: () => jest.fn(),
      },
    },
  });
};
