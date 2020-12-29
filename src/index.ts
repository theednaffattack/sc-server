import "reflect-metadata";
import { ApolloServer, ApolloError } from "apollo-server-express";
import * as Express from "express";
import { ArgumentValidationError } from "type-graphql";
import { createConnection } from "typeorm";
import { GraphQLFormattedError, GraphQLError } from "graphql";
import session from "express-session";
import connectRedis from "connect-redis";
import internalIp from "internal-ip";
import colors from "colors/safe";
import http from "http";
import cors, { CorsOptions as CorsOptionsProps } from "cors";

import { redis } from "./redis";
import { redisSessionPrefix } from "./constants";
import { createSchema } from "./global-utils/createSchema";
import { devOrmconfig } from "./config/dev-orm-config";
import { productionOrmConfig } from "./config/prod-orm-config";
import { MyContext } from "./types/MyContext";
import { runMigrations } from "./lib/util.prep-dev-database";
// import { createUsersLoader } from "./modules/utils/data-loaders/batch-user-loader";

// interface CorsOptionsProps {
//   credentials: boolean;
//   origin: (origin: any, callback: any) => void;
// }

const port = process.env.VIRTUAL_PORT;

const RedisStore = connectRedis(session);

let sessionMiddleware: Express.RequestHandler;

// const nodeEnvIsDev = process.env.NODE_ENV === "development";
// const nodeEnvIs_NOT_Prod = process.env.NODE_ENV !== "production";
const nodeEnvIsProd = process.env.NODE_ENV === "production";

const ormConnection = nodeEnvIsProd ? productionOrmConfig : devOrmconfig;

const getContextFromHttpRequest = async (
  req: MyContext["req"],
  res: MyContext["res"]
) => {
  if (req && req.session) {
    const { teamId, userId } = req.session;
    return { userId, req, res, teamId };
  }
  return ["No session detected"];
};

const getContextFromSubscription = (connection: any) => {
  const { userId } = connection.context.req.session;
  return {
    userId,
    req: connection.context.req,
    teamId: connection.context.teamId,
  };
};

const main = async () => {
  try {
    await createConnection(ormConnection);
  } catch (error) {
    console.warn("CONNECTION ERROR", error);
  }

  let retries = 5;
  // Loop to run migrations. Keep
  // trying until
  while (retries) {
    try {
      await runMigrations();
      // If the migrations run successfully,
      // exit the while loop.
      break;
    } catch (error) {
      console.error("SOME KIND OF ERROR CONNECTING OCCURRED\n", {
        error,
        dirname: __dirname,
        POSTGRES_DBNAME: process.env.POSTGRES_DBNAME,
        POSTGRES_USER: process.env.POSTGRES_USER,
        POSTGRES_PASS: process.env.POSTGRES_PASS,
      });

      retries -= 1;
      // eslint-disable-next-line no-console
      console.log(`\n\nRETRIES LEFT: ${retries}\n\n`);
      // wait 5 seconds
      setTimeout(() => console.log("TIMEOUT FIRING"), 5000);
    }
  }

  let schema;
  try {
    schema = await createSchema();
  } catch (error) {
    console.warn("CREATE SCHEMA ERROR", error);
  }
  const apolloServer = new ApolloServer({
    introspection: true,
    playground: { version: "1.7.25", endpoint: "/graphql" },
    schema,
    context: ({ req, res, connection }: any) => {
      if (connection) {
        return getContextFromSubscription(connection);
        // return {
        //   ...getContextFromSubscription(connection),
        //   usersLoader: createUsersLoader()
        // };
      }

      return getContextFromHttpRequest(req, res);

      // return {
      //   ...getContextFromHttpRequest(req, res),
      //   usersLoader: createUsersLoader()
      // };

      // return { req, res, connection }
    },
    subscriptions: {
      path: "/subscriptions",
      onConnect: (_, ws: any) => {
        return new Promise((res) =>
          sessionMiddleware(ws.upgradeReq, {} as any, () => {
            res({ req: ws.upgradeReq });
          })
        );
      },
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
          path,
        };
      }

      //   error.message = "Internal Server Error";

      return {
        message:
          extensions?.exception?.stacktrace[0].replace("Error: ", "") ??
          message,
        path,
        locations,
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
    ],
  });

  const homeIp = internalIp.v4.sync();

  const app = Express.default();

  const allowedListOfOrigins = nodeEnvIsProd
    ? [
        `${process.env.PRODUCTION_CLIENT_URI}`,
        `${process.env.PRODUCTION_API_URI}`,
        `${process.env.GRAPHQL_ENDPOINT}`,
      ]
    : [
        "http://localhost:3000",
        "http://localhost:4000",
        `http://${homeIp}:3000`,
        `http://${homeIp}:${process.env.VIRTUAL_PORT}`,
      ];

  const corsOptions: CorsOptionsProps = {
    credentials: true,
    origin: function (origin: any, callback: any) {
      if (!origin || allowedListOfOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.error("cors error:: origin: ", {
          origin,
          allowedListOfOrigins,
        });
      }
    },
  };

  // needed to remove domain from our cookie
  // in non-production environments
  if (nodeEnvIsProd) {
    sessionMiddleware = session({
      name: "scg",
      secret: process.env.SESSION_SECRET as string,
      store: new RedisStore({
        client: redis as any,
        prefix: redisSessionPrefix,
      }),
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: true,
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days,
        domain: "ednaff.dev",
      },
    });
  } else {
    sessionMiddleware = session({
      name: "scg",
      secret: process.env.SESSION_SECRET as string,
      store: new RedisStore({
        client: redis as any,
        prefix: redisSessionPrefix,
      }),
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        // secure: true,
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days,
        domain: `${homeIp}`,
      },
    });
  }

  app.use(sessionMiddleware);

  // we're bypassing cors used by apollo-server-express here
  app.use(cors(corsOptions));

  apolloServer.applyMiddleware({ app, cors: false });

  let httpServer = http.createServer(app);
  apolloServer.installSubscriptionHandlers(httpServer);

  // needed for heroku deployment
  app.enable("trust proxy");

  // needed for heroku deployment
  // they set the "x-forwarded-proto" header???
  if (nodeEnvIsProd) {
    app.use(function (req, res, next) {
      if (req.header("x-forwarded-proto") !== "https") {
        res.redirect("https://" + req.header("host") + req.url);
      } else {
        next();
      }
    });
  }

  httpServer.listen(port, () => {
    console.log(`

${colors.bgYellow(colors.black("    server started    "))}

GraphQL Playground available at:
    ${colors.green("localhost")}: http://localhost:${port}${
      apolloServer.graphqlPath
    }
          ${colors.green("LAN")}: http://${homeIp}:${port}${
      apolloServer.graphqlPath
    }

WebSocket subscriptions available at:
${colors.green("slack_clone server")}: ws://${homeIp}:${port}${
      apolloServer.subscriptionsPath
    }


`);
  });
};

main();
