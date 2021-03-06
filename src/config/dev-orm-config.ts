import { PostgresConnectionOptions } from "typeorm/driver/postgres/PostgresConnectionOptions";
import internalIp from "internal-ip";

const homeIp = internalIp.v4.sync();

export const devOrmconfig: PostgresConnectionOptions = {
  name: "default",
  type: "postgres",
  host: homeIp,
  port: process.env.PG_EXTERIOR_PORT
    ? parseInt(process.env.PG_EXTERIOR_PORT)
    : 5438,
  ssl: false,
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASS,
  database: process.env.POSTGRES_DBNAME,
  logging: true,
  synchronize: true,
  entities: ["src/entity/**/*.*"],
  migrations: ["src/migration/**/*.ts"],
  subscribers: ["src/subscriber/**/*.ts"],
  cli: {
    entitiesDir: "src/entity",
    migrationsDir: "src/migration",
    subscribersDir: "src/subscriber",
  },
};
