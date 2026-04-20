import 'dotenv/config';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL environment variable is not set');
  console.error('Please set it before running this script:');
  console.error('  export DATABASE_URL=postgresql://booker:booker@localhost:5435/booker_test');
  process.exit(1);
}

const sql = postgres(connectionString);

const testBranches = [
  { name: 'Sandton Main Branch', address: '123 Sandton Drive, Johannesburg, 2196', openingTime: '08:00:00', closingTime: '17:00:00' },
  { name: 'Cape Town CBD Branch', address: '45 Main Street, Cape Town, 8001', openingTime: '08:30:00', closingTime: '16:30:00' },
  { name: 'Durban Sea Point Branch', address: '78 Beach Road, Durban, 4001', openingTime: '09:00:00', closingTime: '15:00:00' },
  { name: 'Pretoria Central Branch', address: '200 Nelson Mandela Ave, Pretoria, 0001', openingTime: '08:00:00', closingTime: '16:00:00' },
  { name: 'Bloemfontein Regional Branch', address: '55 Main Street, Bloemfontein, 9301', openingTime: '08:00:00', closingTime: '17:00:00' },
  { name: 'Port Elizabeth Branch', address: '12 Govan Mbeki Ave, Port Elizabeth, 6001', openingTime: '08:30:00', closingTime: '16:30:00' },
  { name: 'Nelspruit Business Branch', address: '30 Henry Street, Nelspruit, 1201', openingTime: '08:00:00', closingTime: '16:00:00' },
  { name: 'Kimberley North Branch', address: '88 Long Street, Kimberley, 8301', openingTime: '09:00:00', closingTime: '15:00:00' },
  { name: 'Polokwane East Branch', address: '42 Thabo Mbeki St, Polokwane, 0700', openingTime: '08:00:00', closingTime: '17:00:00' },
  { name: 'George Main Branch', address: '71 Meyer Street, George, 6530', openingTime: '08:30:00', closingTime: '16:30:00' },
];

async function seed() {
  console.log('🌱 Seeding test database...\n');

  let created = 0;

  for (const branch of testBranches) {
    try {
      await sql`
        INSERT INTO branches (name, address, opening_time, closing_time)
        VALUES (${branch.name}, ${branch.address}, ${branch.openingTime}::time, ${branch.closingTime}::time)
        ON CONFLICT DO NOTHING
      `;
      created++;
    } catch (error) {
      console.error(`  ✗ Failed at ${branch.name}:`, error);
    }
  }

  console.log(`✅ Seeded ${created} test branches\n`);

  await sql.end();
  process.exit(0);
}

seed().catch((error) => {
  console.error('\n❌ Seeding failed:', error);
  sql.end();
  process.exit(1);
});