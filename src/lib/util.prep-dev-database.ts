import { DbMate } from "dbmate";
import { readdir } from "fs";
import { getConnectionString } from "./util.get-connection-string";

/**
 * Utility function to run migrations with DbMate.
 * @returns      Promise<void>.
 */
export async function runMigrations(): Promise<void> {
  // construct a dbmate instance using a database url string
  // see https://github.com/amacneil/dbmate#usage for more details

  const dbConnectionString = getConnectionString(process.env.NODE_ENV);

  const dbmate = new DbMate(dbConnectionString);

  const numberOfMigrationFiles = await new Promise<number>(
    (resolve, reject) => {
      readdir(`${process.cwd()}/db/migrations`, function (error, files) {
        if (error) {
          reject(error);
        } else {
          resolve(files.length);
        }
        return;
      });
    }
  );

  // invoke up, down, drop as necessary
  if (numberOfMigrationFiles !== undefined && numberOfMigrationFiles > 0) {
    console.log(
      `DBMATE INITIATING MIGRATIONS\nRunning ${numberOfMigrationFiles} data migration(s) running.`
    );
    try {
      await dbmate.up();
    } catch (dbmateError) {
      console.error("MIGRATION ERROR\n", dbmateError);
    }
  }
}

runMigrations()
  .then(() => {
    console.log("RUN MIGRATIONS SCRIPT PROCESS ENDING");
    // process.exit();
  })
  .catch(catchError);

/**
 * Custom migration error catching function.
 * @param error  An Error object.
 * @returns      void.
 */
function catchError(error: Error): void {
  console.warn("Error running migration script\n", error);
}
