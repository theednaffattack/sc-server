import { Connection, createConnection } from "typeorm";
import { devOrmconfig } from "../config/dev-orm-config";

// adapted from: https://stackoverflow.com/a/63112753/9448010
export async function dropData() {
  // create postgres connection
  let conn: Connection;

  try {
    conn = await createConnection(devOrmconfig);
  } catch (error) {
    throw Error(error);
  }

  // Fetch all the entities
  const entities = conn.entityMetadatas;

  try {
    await Promise.all(
      entities.map(async (entity) => {
        const repository = conn.getRepository(entity.name);
        try {
          console.log(`\n Deleting "${entity.name}".`);

          const deletionResult = await repository.delete({});

          console.log(
            `\n Deletion result for "${entity.name}".`,
            deletionResult
          );

          return deletionResult;
        } catch (error) {
          throw new Error(error);
        }
      })
    );
  } catch (error) {
    console.error("ERROR IN PROMISE ALL", error);
  }

  conn.close();
  console.log("HOW FAR DO WE GET?");

  // // Loop over entities to clear (TRUNCATE) each table.
  // for (const entity of entities) {
  //   // Get repository.
  //   const repository = conn.getRepository(entity.name);
  //   // Clear each entity table's content.
  //   try {
  //     await repository.delete({});
  //   } catch (error) {
  //     console.error("ERROR CLEARING REPOSITORY", error);
  //   }
  //   // Report to the console as this is used in a package
  //   // script.
  //   console.log(`\n${entity.name} truncated.`);
  // }
}

dropData()
  .then(() => console.log("PROMISE RETURNED WITHOUT ERROR"))
  .catch((err) => {
    console.error("ARE THERE ERRORS", err);
    process.exit();
  })
  .finally(() => {
    console.log("FINALLY");
    process.exit();
  });
