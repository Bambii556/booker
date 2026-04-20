import { config } from 'dotenv';
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { migrate } from "drizzle-orm/postgres-js/migrator";

config({ path: '.env' });

async function runMigrations() {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('DATABASE_URL is not set. Make sure .env file exists or set the environment variable.');
    process.exit(1);
  }
  
  console.log(`Connecting to database...`);
  const client = postgres(connectionString, { prepare: false });
  const db = drizzle(client, { schema });

  console.log("Running migrations...");
  await migrate(db, { migrationsFolder: "./drizzle/migrations" });
  console.log("Migrations complete!");

  await client.end();
  process.exit(0);
}

runMigrations().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
