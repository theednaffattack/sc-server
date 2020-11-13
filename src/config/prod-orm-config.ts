import { PostgresConnectionOptions } from "typeorm/driver/postgres/PostgresConnectionOptions";

export const productionOrmConfig: PostgresConnectionOptions = {
  name: "default",
  type: "postgres",
  host: process.env.PG_DB_HOST,
  port: parseInt(process.env.PG_DB_PORT!, 10),
  ssl: true,
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASS,
  database: process.env.POSTGRES_DBNAME,
  logging: process.env.NODE_ENV !== "production",
  synchronize: process.env.NODE_ENV !== "production",
  entities: ["src/entity/*.*"],
  migrations: ["src/migration/**/*.ts"],
  subscribers: ["src/subscriber/**/*.ts"],
};
