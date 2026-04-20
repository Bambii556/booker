import postgres from 'postgres';
import { config } from 'dotenv';

config({ path: '.env' });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

const sql = postgres(connectionString);

async function resetDatabase() {
  console.log('⚠️  This will drop all tables and recreate them.\n');
  
  const confirmed = process.argv.includes('--confirm');
  if (!confirmed) {
    console.log('Run with --confirm to proceed: npm run db:reset');
    await sql.end();
    process.exit(0);
  }

  console.log('Dropping existing tables...\n');

  await sql`DROP TABLE IF EXISTS appointments CASCADE`;
  await sql`DROP TABLE IF EXISTS branches CASCADE`;
  await sql`DROP TABLE IF EXISTS verifications CASCADE`;
  await sql`DROP TABLE IF EXISTS accounts CASCADE`;
  await sql`DROP TABLE IF EXISTS sessions CASCADE`;
  await sql`DROP TABLE IF EXISTS users CASCADE`;
  console.log('✓ All tables dropped\n');

  console.log('Creating users table...');
  await sql`
    CREATE TABLE users (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text,
      email text NOT NULL UNIQUE,
      email_verified boolean NOT NULL DEFAULT false,
      image text,
      created_at timestamptz NOT NULL DEFAULT NOW(),
      updated_at timestamptz NOT NULL DEFAULT NOW()
    )
  `;
  console.log('✓ users table created\n');

  console.log('Creating sessions table...');
  await sql`
    CREATE TABLE sessions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      expires_at timestamptz NOT NULL,
      token_hash text NOT NULL UNIQUE,
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at timestamptz DEFAULT NOW(),
      updated_at timestamptz DEFAULT NOW(),
      ip_address text,
      user_agent text
    )
  `;
  console.log('✓ sessions table created\n');

  console.log('Creating accounts table...');
  await sql`
    CREATE TABLE accounts (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      account_id text NOT NULL,
      provider_id text NOT NULL,
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      access_token text,
      refresh_token text,
      id_token text,
      access_token_expires_at timestamptz,
      refresh_token_expires_at timestamptz,
      scope text,
      password text,
      created_at timestamptz DEFAULT NOW(),
      updated_at timestamptz DEFAULT NOW()
    )
  `;
  console.log('✓ accounts table created\n');

  console.log('Creating verifications table...');
  await sql`
    CREATE TABLE verifications (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      identifier text NOT NULL,
      value text NOT NULL,
      expires_at timestamptz NOT NULL,
      created_at timestamptz DEFAULT NOW(),
      updated_at timestamptz DEFAULT NOW()
    )
  `;
  console.log('✓ verifications table created\n');

  console.log('Creating branches table...');
  await sql`
    CREATE TABLE branches (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      address text NOT NULL,
      opening_time time NOT NULL,
      closing_time time NOT NULL,
      timezone text NOT NULL DEFAULT 'Africa/Johannesburg',
      created_at timestamptz NOT NULL DEFAULT NOW()
    )
  `;
  console.log('✓ branches table created\n');

  console.log('Creating appointments table...');
  await sql`
    CREATE TABLE appointments (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      booking_reference text NOT NULL UNIQUE,
      branch_id uuid NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
      user_id text NOT NULL,
      scheduled_at timestamptz NOT NULL,
      status text NOT NULL DEFAULT 'pending',
      created_at timestamptz NOT NULL DEFAULT NOW()
    )
  `;
  console.log('✓ appointments table created\n');

  console.log('Creating indexes...');
  await sql`CREATE INDEX idx_sessions_user_id ON sessions(user_id)`;
  await sql`CREATE INDEX idx_accounts_user_id ON accounts(user_id)`;
  await sql`CREATE INDEX idx_appointments_branch_scheduled ON appointments(branch_id, scheduled_at, status)`;
  await sql`CREATE UNIQUE INDEX idx_unique_active_appointment ON appointments(branch_id, scheduled_at) WHERE status = 'confirmed'`;
  console.log('✓ indexes created\n');

  console.log('✨ Database reset complete! Run "npm run db:seed" to populate branches.\n');
  
  await sql.end();
  process.exit(0);
}

resetDatabase().catch((err) => {
  console.error('\n❌ Reset failed:', err);
  sql.end();
  process.exit(1);
});
