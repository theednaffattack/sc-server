import { PostgresConnectionOptions } from "typeorm/driver/postgres/PostgresConnectionOptions";

const loggingStatus = process.env.TYPEORM_LOGGING === "false";
const isSynchronizeTrue = process.env.TYPEORM_SYNCHRONIZE === "true";

const getPortOrSetDefault = process.env.TYPEORM_PORT
  ? parseInt(process.env.TYPEORM_PORT)
  : 5432;

export const productionOrmConfig: PostgresConnectionOptions = {
  name: "default",
  type: "postgres",
  host: process.env.TYPEORM_HOST,
  port: getPortOrSetDefault,
  ssl: true,
  username: process.env.TYPEORM_USERNAME,
  password: process.env.TYPEORM_PASSWORD,
  database: process.env.TYPEORM_DATABASE,
  logging: loggingStatus,
  synchronize: isSynchronizeTrue,
  entities: ["src/entity/*.*"],
  migrations: ["src/migration/**/*.ts"],
  subscribers: ["src/subscriber/**/*.ts"]
};
