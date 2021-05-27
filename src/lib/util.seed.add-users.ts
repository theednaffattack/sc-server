import bcrypt from "bcryptjs";
import { createConnection } from "typeorm";

import { devOrmconfig } from "../../src/config/dev-orm-config";
import { User } from "../entity/User";

const fakeUsers = [
  {
    confirmed: true,
    email: "eddienaff@gmail.com",
    firstName: "eddie",
    lastName: "naff",
    password: "testLoad",
    team_scopes: [`ABC-123::GUEST`],
    username: "eddienaff",
  },
  {
    confirmed: true,
    email: "ayo@ayo.com",
    firstName: "ayo",
    lastName: "ayo",
    password: "testLoad",
    team_scopes: [`ABC-123::GUEST`],
    username: "ayo",
  },
  {
    confirmed: true,
    email: "iti@iti.com",
    firstName: "iti",
    password: "testLoad",
    lastName: "iti",
    team_scopes: [`ABC-123::GUEST`],
    username: "iti",
  },
  {
    confirmed: true,
    email: "bob@bob.com",
    firstName: "bob",
    lastName: "bob",
    password: "testLoad",
    team_scopes: [`ABC-123::GUEST`],
    username: "bob",
  },
];

export async function addUsers() {
  let dbConnection;
  const users = await Promise.all(
    fakeUsers.map(async (theUser) => {
      return {
        ...theUser,
        password: await bcrypt.hash("testLoad", 12),
      };
    })
  );

  try {
    dbConnection = await createConnection(devOrmconfig);
  } catch (error) {
    throw Error(error);
  }

  if (dbConnection) {
    try {
      await dbConnection
        .createQueryBuilder(User, "user")
        .insert()
        .into(User)
        .values(users)
        .execute();
    } catch (error) {
      throw Error(error);
    }
  }
}

addUsers()
  .then(() => {
    console.log(`PROMISE "addUsers" RETURNED WITHOUT ERROR`);
  })
  .catch((err) => {
    console.error(`ERRORS for "addUsers"`, err);
    process.exit();
  })
  .finally(() => {
    console.log("FINALLY");
    process.exit();
  });
