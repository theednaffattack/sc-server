import { createConnection } from "typeorm";

export const testConn = (drop: boolean = false) => {
  return createConnection({
    name: "default",
    type: "postgres",
    host: "localhost",
    port: 5432,
    username: "eddienaff", // superuser
    password: "eddienaff",
    database: "sc_backend_testing",
    dropSchema: drop,
    synchronize: true,
    entities: [__dirname + "/../entity/*.*"]
  });
};
