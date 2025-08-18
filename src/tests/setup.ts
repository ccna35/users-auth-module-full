import { execSync } from "child_process";
import mysql from "mysql2/promise";
import { beforeAll, beforeEach } from "vitest";

const dbUrl =
  process.env.DATABASE_URL || "mysql://root:password@localhost:3306/appdb_test";
let conn: mysql.Connection;

beforeAll(async () => {
  conn = await mysql.createConnection(dbUrl);
  // Run migration SQL file
  const migration = execSync("cat src/db/migrations/001_init.sql").toString();
  await conn.query(migration);
});

beforeEach(async () => {
  await conn.query("SET FOREIGN_KEY_CHECKS = 0");
  const [tables] = (await conn.query("SHOW TABLES")) as any;
  for (const row of tables) {
    const table = Object.values(row)[0];
    await conn.query(`TRUNCATE TABLE \`${table}\``);
  }
  await conn.query("SET FOREIGN_KEY_CHECKS = 1");
});
