import "reflect-metadata";
import { ApolloServer, ApolloError } from "apollo-server-express";
import * as Express from "express";
import { ArgumentValidationError } from "type-graphql";
import { createConnection } from "typeorm";
import { GraphQLFormattedError, GraphQLError } from "graphql";
// import session from "express-session";
// import connectRedis from "connect-redis";
import internalIp from "internal-ip";
import colors from "colors/safe";
import http from "http";
import cors, { CorsOptions as CorsOptionsProps } from "cors";
import cookieParser from "cookie-parser";

// import { redis } from "./redis";
// import { redisSessionPrefix } from "./constants";
import { createSchemaSync } from "./global-utils/createSchema";
import { devOrmconfig } from "./config/dev-orm-config";
import { productionOrmConfig } from "./config/prod-orm-config";
import { MyContext } from "./types/MyContext";
import { runMigrations } from "./lib/util.prep-dev-database";
import { verify } from "jsonwebtoken";
import { User } from "./entity/User";
import { sendRefreshToken } from "./lib/lib.send-refresh-token";
import { createRefreshToken, createAccessToken } from "./lib/auth.jwt-auth";
// import { createUsersLoader } from "./modules/utils/data-loaders/batch-user-loader";

// interface CorsOptionsProps {
//   credentials: boolean;
//   origin: (origin: any, callback: any) => void;
// }

const port = process.env.VIRTUAL_PORT;

// const RedisStore = connectRedis(session);

// let sessionMiddleware: Express.RequestHandler;

// const nodeEnvIsDev = process.env.NODE_ENV === "development";
// const nodeEnvIs_NOT_Prod = process.env.NODE_ENV !== "production";
const nodeEnvIsProd = process.env.NODE_ENV === "production";

const ormConnection = nodeEnvIsProd ? productionOrmConfig : devOrmconfig;

const getContextFromHttpRequest = (
  req: MyContext["req"],
  res: MyContext["res"]
) => {
  // old cookie implementation
  // if (req && req.session) {
  //   const { teamId, userId } = req.session;

  //   return { userId, req, res, teamId };
  // }

  // JWT implementation
  const authorization = req.headers["authorization"];
  if (authorization) {
    try {
      const token = authorization.split(" ")[1];
      const payload = verify(token, process.env.ACCESS_TOKEN_SECRET!);
      return {
        req,
        res,
        payload: { token: payload },
        token: req.headers.authorization || "",
      };
    } catch (err) {
      console.log("IS AUTH ERROR", err);
      // throw new Error("Not authenticated");
      return {
        req,
        res,
        payload: {
          token: undefined,
          errors: [err],
        },
        token: req.headers.authorization || "",
      };
    }
  } else {
    return { req, res };
  }
};

const getContextFromSubscription = (connection: any) => {
  // old cookie implementation
  // const { userId } = connection.context.req.session;

  const authorization = connection.context.authorization;
  if (authorization) {
    try {
      const token = authorization.split(" ")[1];
      const payload = verify(token, process.env.ACCESS_TOKEN_SECRET!);
      return {
        payload: { token: payload },
        req: connection.context.req,
        res: connection.context.res,
        teamId: connection.context.teamId,
        token: authorization,
      };
    } catch (error) {
      throw Error("Error authenticating subscription.");
    }
  } else {
    return { req: connection.context.req, res: connection.context.res };
  }
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

      // if (process.env.NODE_ENV === "production") {
      //   await runMigrations();
      //   // If the migrations run successfully,
      //   // exit the while loop.
      //   break;
      // } else {
      //   console.log("SKIP MIGRATIONS - DEV ENV");
      //   break;
      // }
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

  const apolloServer = new ApolloServer({
    introspection: true,
    playground: { version: "1.7.25", endpoint: "/graphql" },
    schema: createSchemaSync,
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
      onConnect: (_connectionParams, _webSocket, _context) => {
        console.log("Client connected");
      },
      onDisconnect: (_webSocket, _context) => {
        console.log("Client disconnected");
      },
      // onConnect: (_, ws: any) => {
      //   return new Promise((res) =>
      //     sessionMiddleware(ws.upgradeReq, {} as any, () => {
      //       res({ req: ws.upgradeReq });
      //     })
      //   );
      // },
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
    ? [`${process.env.PRODUCTION_CLIENT_URI}`]
    : [`http://${homeIp}:4040`, `http://${homeIp}:${process.env.VIRTUAL_PORT}`];

  const corsOptions: CorsOptionsProps = {
    credentials: true,
    methods: "GET,HEAD,POST,OPTIONS",
    optionsSuccessStatus: 200,
    preflightContinue: false,
    // allowedHeaders:,
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

  // old cookie implentation
  // if (nodeEnvIsProd) {
  //   sessionMiddleware = session({
  //     cookie: {
  //       httpOnly: true,
  //       secure: true,
  //       maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days,
  //       domain: process.env.PRODUCTION_CLIENT_ORIGIN,
  //       path: "/",
  //     },
  //     name: process.env.COOKIE_NAME,
  //     resave: false,
  //     saveUninitialized: false,
  //     secret: process.env.SESSION_SECRET as string,
  //     store: new RedisStore({
  //       client: redis as any,
  //       prefix: redisSessionPrefix,
  //     }),
  //   });
  // } else {
  //   sessionMiddleware = session({
  //     name: process.env.COOKIE_NAME,
  //     secret: process.env.SESSION_SECRET as string,
  //     store: new RedisStore({
  //       client: redis as any,
  //       prefix: redisSessionPrefix,
  //     }),
  //     resave: false,
  //     saveUninitialized: false,
  //     cookie: {
  //       httpOnly: true,
  //       // secure: true,
  //       maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days,
  //       domain: `${homeIp}`,
  //     },
  //   });
  // }

  // we're bypassing cors used by apollo-server-express here
  app.use(cors(corsOptions));
  app.options("*", cors(corsOptions));

  app.use(cookieParser());
  // app.use(sessionMiddleware);

  app.get("/", (_req, res) => res.send("hello"));

  app.post("/refresh_token", async (req, res) => {
    console.log("VIEW COOKIES", req.cookies);
    console.log("VIEW MY COOKIE", req.cookies[process.env.COOKIE_NAME!]);

    const token = req.cookies[process.env.COOKIE_NAME!];
    if (!token) {
      return res.send({ ok: false, accessToken: "" });
    }

    let payload: any = null;
    try {
      payload = verify(token, process.env.REFRESH_TOKEN_SECRET!);
    } catch (err) {
      console.log("TOKEN VERIFICATION ERROR", err);
      return res.send({ ok: false, accessToken: "" });
    }

    // token is valid and
    // we can send back an access token
    const user = await User.findOne({ id: payload.userId });

    // if we can't find a user don't send a token
    if (!user) {
      return res.send({ ok: false, accessToken: "" });
    }

    // check the token version to make sure don't send?
    // seems strange
    if (user.tokenVersion !== payload.tokenVersion) {
      return res.send({ ok: false, accessToken: "" });
    }

    sendRefreshToken(res, createRefreshToken(user));

    return res.send({ ok: true, accessToken: createAccessToken(user) });
  });

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
