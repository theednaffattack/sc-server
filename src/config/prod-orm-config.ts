import { PostgresConnectionOptions } from "typeorm/driver/postgres/PostgresConnectionOptions";

// Dokku DATABASE_URL env variable can be destructured as...
// [database type]://[username]:[password]@[host]:[port]/[database name]
// TypeOrm seems to require the "type" connection option property
// even if using a connection string via the "url" parameter.

export const productionOrmConfig: PostgresConnectionOptions = {
  name: "default",
  url: process.env.DATABASE_URL,
  type: "postgres",
  ssl: false,
  logging: false,
  synchronize: false,
  entities: ["dist/entity/*.*"],
  migrations: ["src/migration/**/*.ts"],
  subscribers: ["src/subscriber/**/*.ts"],
};
