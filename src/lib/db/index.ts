import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;

const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });

export const authSchema = {
  user: schema.user,
  session: schema.session,
  account: schema.account,
  verification: schema.verification,
};
