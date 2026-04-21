import { config } from 'dotenv';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../src/lib/db/schema';
import { migrate } from 'drizzle-orm/postgres-js/migrator';

config({ path: '.env' });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

const dbUrl: string = connectionString;

async function waitForDatabase(maxAttempts = 30): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const testClient = postgres(dbUrl, { prepare: false });
      await testClient`SELECT 1`;
      await testClient.end();
      return true;
    } catch {
      console.log(`  Database unavailable - attempt ${i + 1}/${maxAttempts}`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  return false;
}

async function tableExists(client: postgres.Sql): Promise<boolean> {
  const result = await client`
    SELECT COUNT(*) FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'branches'
  `;
  return Number(result[0].count) === 1;
}

async function getBranchCount(client: postgres.Sql): Promise<number> {
  const result = await client`SELECT COUNT(*) FROM branches`;
  return Number(result[0].count);
}

async function runMigrations() {
  console.log('Running migrations...');
  const client = postgres(dbUrl, { prepare: false });
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: './drizzle/migrations' });
  await client.end();
  console.log('Migrations complete!');
}

async function runSeed() {
  console.log('Running seed script...');
  const { spawn } = await import('child_process');
  
  return new Promise<void>((resolve, reject) => {
    const proc = spawn('npx', ['tsx', 'scripts/seed-db.ts'], {
      stdio: 'inherit',
      shell: true,
    });
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Seed script exited with code ${code}`));
    });
    proc.on('error', reject);
  });
}

async function main() {
  console.log('Waiting for database to be ready...');
  const ready = await waitForDatabase();
  if (!ready) {
    console.error('Database never became available');
    process.exit(1);
  }
  console.log('Database is ready!');

  await runMigrations();

  console.log('Checking if seed data is needed...');
  const client = postgres(dbUrl, { prepare: false });
  
  const exists = await tableExists(client);
  if (exists) {
    const count = await getBranchCount(client);
    if (count === 0) {
      console.log('No seed data found. Running seed script...');
      await runSeed();
    } else {
      console.log(`Seed data already exists (${count} branches). Skipping seed.`);
    }
  } else {
    console.log('Branches table does not exist yet. Run migrations first.');
  }
  
  await client.end();
  console.log('Initialization complete!');
}

main().catch((error) => {
  console.error('Initialization failed:', error);
  process.exit(1);
});