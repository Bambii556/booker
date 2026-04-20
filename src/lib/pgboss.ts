import { PgBoss } from 'pg-boss';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined');
}

const boss = new PgBoss(connectionString);

export default boss;