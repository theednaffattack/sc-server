import { PostgresConnectionOptions } from "typeorm/driver/postgres/PostgresConnectionOptions";

export const devOrmconfig: PostgresConnectionOptions = {
  name: "default",
  type: "postgres",
  host: "10.0.0.188",
  port: 5432,
  ssl: false,
  username: process.env.POSTGRES_USER, // "eddienaff",
  password: process.env.POSTGRES_PASS, // "eddienaff",
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
