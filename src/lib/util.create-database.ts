var pgtools = require("pgtools");

const config = {
  user: "postgres", // process.env.POSTGRES_USER,
  host: "127.0.0.1", //process.env.PG_DB_HOST,
  password: "postgres", // process.env.POSTGRES_PASS,
  port: process.env.PG_DB_PORT,
};

// process.env.POSTGRES_DBNAME

pgtools.createdb(config, "test-db", function (err: Error, res: Response) {
  if (err) {
    console.error(err);
    process.exit(-1);
  }
  console.log(res);
});
