import "reflect-metadata";
import { ApolloServer, ApolloError } from "apollo-server-express";
import * as Express from "express";
import { ArgumentValidationError } from "type-graphql";
import { createConnection } from "typeorm";
import { GraphQLFormattedError, GraphQLError } from "graphql";
import session from "express-session";
import connectRedis from "connect-redis";
// import cors from "cors";
import internalIp from "internal-ip";
import colors from "colors/safe";
import http from "http";

// import logger from "pino";

import { redis } from "./redis";
import { redisSessionPrefix } from "./constants";
import { createSchema } from "./global-utils/createSchema";
import { devOrmconfig } from "./config/dev-orm-config";
import { productionOrmConfig } from "./config/prod-orm-config";

interface CorsOptionsProps {
  credentials: boolean;
  origin: (origin: any, callback: any) => void;
}

const RedisStore = connectRedis(session);

let sessionMiddleware: Express.RequestHandler;

// const nodeEnvIsDev = process.env.NODE_ENV === "development";
// const nodeEnvIs_NOT_Prod = process.env.NODE_ENV !== "production";
const nodeEnvIsProd = process.env.NODE_ENV === "production";

const ormConnection = nodeEnvIsProd ? productionOrmConfig : devOrmconfig;

const getContextFromHttpRequest = async (req: any, res: any) => {
  if (req && req.session) {
    const { userId } = req.session;
    return { userId, req, res };
  }
  return ["No session detected"];
};

const getContextFromSubscription = (connection: any) => {
  const { userId } = connection.context.req.session;
  return { userId, req: connection.context.req };
};

const main = async () => {
  await createConnection(ormConnection);

  const schema = await createSchema();

  const apolloServer = new ApolloServer({
    schema,
    playground: { version: "1.7.25", endpoint: "/graphql" },
    context: ({ req, res, connection }: any) => {
      if (connection) {
        return getContextFromSubscription(connection);
      }

      return getContextFromHttpRequest(req, res);

      // return { req, res, connection }
    },
    subscriptions: {
      path: "/subscriptions",
      onConnect: (_, ws: any) => {
        return new Promise(res =>
          sessionMiddleware(ws.upgradeReq, {} as any, () => {
            res({ req: ws.upgradeReq });
          })
        );
      }
    },
    // custom error handling from:
    // https://github.com/19majkel94/type-graphql/issues/258
    formatError: (error: GraphQLError): GraphQLFormattedError => {
      if (error.originalError instanceof ApolloError) {
        return error;
      }

      const { extensions = {}, locations, message, path } = error;

      if (error.originalError instanceof ArgumentValidationError) {
        extensions.code = "GRAPHQL_VALIDATION_FAILED";

        return {
          extensions,
          locations,
          message,
          path
        };
      }

      //   error.message = "Internal Server Error";

      return {
        message: extensions.exception.stacktrace[0].replace("Error: ", ""),
        path,
        locations
        // extensions
      };
    },
    validationRules: [
      // queryComplexity({
      //   // queries above this threshold are rejected
      //   maximumComplexity: 8,
      //   variables: {},
      //   onComplete: (complexity: number) => {
      //     console.log("Query Complexity:", complexity);
      //   },
      //   estimators: [
      //     fieldConfigEstimator(),
      //     simpleEstimator({
      //       defaultComplexity: 1
      //     })
      //   ]
      // }) as any
    ]
  });

  const homeIp = internalIp.v4.sync();

  const app = Express.default();

  const whitelistedOrigins = nodeEnvIsProd
    ? [`${process.env.PRODUCTION_ORIGIN}`, `${process.env.GRAPHQL_ENDPOINT}`]
    : [
        "http://localhost:3000",
        "http://localhost:4000",
        `http://${homeIp}:3000`,
        `http://${homeIp}:4000`
      ];

  const corsOptions: CorsOptionsProps = {
    credentials: true,
    origin: function(origin: any, callback: any) {
      if (!origin || whitelistedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.error("cors error:: origin: ", origin);
      }
    }
  };

  // // we're bypassing cors used by apollo-server-express here
  // app.use(
  //   cors({
  //     credentials: true,
  //     origin: function(origin, callback) {
  //       if (whitelistedOrigins.indexOf(origin) !== -1 || !origin) {
  //         callback(null, true);
  //       } else {
  //         callback(new Error("Not allowed by CORS"));
  //       }
  //     }
  //   })
  // );

  // needed to remove domain from our cookie
  // in non-production environments
  if (nodeEnvIsProd) {
    sessionMiddleware = session({
      name: "scg",
      secret: process.env.SESSION_SECRET as string,
      store: new RedisStore({
        client: redis as any,
        prefix: redisSessionPrefix
      }),
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: true,
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days,
        domain: "eddienaff.dev"
      }
    });
  } else {
    sessionMiddleware = session({
      name: "scg",
      secret: process.env.SESSION_SECRET as string,
      store: new RedisStore({
        client: redis as any,
        prefix: redisSessionPrefix
      }),
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        // secure: true,
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days,
        domain: `${homeIp}`
      }
    });
  }

  app.use(sessionMiddleware);

  apolloServer.applyMiddleware({ app, cors: corsOptions });

  let httpServer = http.createServer(app);
  apolloServer.installSubscriptionHandlers(httpServer);

  // needed for heroku deployment
  app.enable("trust proxy");

  // needed for heroku deployment
  // they set the "x-forwarded-proto" header???
  if (nodeEnvIsProd) {
    app.use(function(req, res, next) {
      if (req.header("x-forwarded-proto") !== "https") {
        res.redirect("https://" + req.header("host") + req.url);
      } else {
        next();
      }
    });
  }

  httpServer.listen(4000, () => {
    console.log(`

${colors.bgYellow(colors.black("    server started    "))}

GraphQL Playground available at:
    ${colors.green("localhost")}: http://localhost:4000${
      apolloServer.graphqlPath
    }
          ${colors.green("LAN")}: http://${homeIp}:4000${
      apolloServer.graphqlPath
    }

WebSocket subscriptions available at:
${colors.green("slack_clone server")}: ws://${homeIp}:4000${
      apolloServer.subscriptionsPath
    }


`);
  });
};

main();
