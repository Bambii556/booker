import { config } from 'dotenv';
import postgres from 'postgres';

config({ path: '.env' });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL environment variable is not set');
  console.error('Please set it before running this script:');
  console.error('  export DATABASE_URL=postgresql://booker:booker@localhost:5432/booker');
  process.exit(1);
}

const sql = postgres(connectionString);

const cities = [
  { city: 'Johannesburg', areas: ['Sandton', 'Rosebank', 'Midrand', 'Randburg', 'Soweto', 'Alexandra', 'Bedfordview', 'Kempton Park', 'Benoni', 'Boksburg', 'Centurion', 'Roodepoort', 'Krugersdorp', 'Alberton', 'Germiston', 'Springs', 'Vanderbijlpark', 'Vereeniging'] },
  { city: 'Cape Town', areas: ['CBD', 'Sea Point', 'Claremont', 'Stellenbosch', 'Paarl', 'Bellville', 'Kuils River', 'Somerset West', 'Muizenberg', 'Constantia', 'Tokai', 'Durbanville', 'Brackenfell', 'Goodwood', 'Parow', 'Stellenbosch', 'Wellington', 'Malmesbury', 'Caledon', 'Strand'] },
  { city: 'Durban', areas: ['CBD', 'Umhlanga', 'Ballito', 'Pinetown', 'Westville', 'Gillitts', 'La Lucia', 'Umdloti', 'Verulam', 'Tongaat', 'Phoenix', 'Chatsworth', 'Isipingo', 'Amanzimtoti', 'Kingsburgh'] },
  { city: 'Port Elizabeth', areas: ['CBD', 'Summerstrand', 'Humewood', 'Newton Park', 'Greenacres', 'Walmer', 'North End', 'Cotswold', 'Korsten'] },
  { city: 'Bloemfontein', areas: ['CBD', 'Westdene', 'Fichardt Park', 'Langenhoven Park', 'Bayswater', 'Helicon Heights', 'Loch Logan'] },
  { city: 'Pretoria', areas: ['CBD', 'Arcadia', 'Hatfield', 'Brooklyn', 'Centurion', 'Sunnyside', 'Menlo Park', 'Lynnwood', 'Garsfontein', 'Silverton', 'Mamelodi', 'Atteridgeville'] },
  { city: 'Nelspruit', areas: ['CBD', 'Nelspruit', 'White River', 'Hazyview', 'Barberton', 'Sabie'] },
  { city: 'Kimberley', areas: ['CBD', 'Beaconsfield', 'Gold Fields', 'R渊eport'] },
  { city: 'Polokwane', areas: ['CBD', 'Bendor', 'Westenburg', 'Pietersburg'] },
  { city: 'Pietermaritzburg', areas: ['CBD', 'Scottsville', 'Hayfields', 'Pmb North', 'Sudbury'] },
  { city: 'East London', areas: ['CBD', 'Vincent', 'Quigney', 'Beacon Bay', 'Nahoon', 'Amalinda'] },
  { city: 'George', areas: ['CBD', 'George South', 'Kingswood', 'Heatherlands'] },
  { city: 'Rustenburg', areas: ['CBD', 'Rustenburg North', 'Boitekong', 'Mafikeng'] },
  { city: 'Witbank', areas: ['CBD', 'Reyno', 'Klarinet', 'eMalahleni'] },
  { city: 'Kimberley', areas: ['CBD', 'Beaconsfield', 'Kimberley South'] },
  { city: 'Upington', areas: ['CBD', 'Upington Central'] },
  { city: 'Klerksdorp', areas: ['CBD', 'Klerksdorp North'] },
  { city: 'Potchefstroom', areas: ['CBD', 'Baillie Park', 'Miederpark'] },
];

const streetNames = [
  'Main Street', 'Church Street', 'Market Street', 'Bond Street', 'Victoria Street',
  'Albert Street', 'Maitland Street', 'Loop Street', 'Kerk Street', 'Buiten Street',
  'Long Street', 'Bree Street', 'Plein Street', 'Harrington Street', 'Riebeek Street',
  'Dorps Street', 'Van der Bijl Street', 'Samora Machel Avenue', 'Moses Kotane Road',
  'Jan Smuts Avenue', 'Rivonia Boulevard', 'Sandton Drive', 'William Nicol Drive',
  'Paul Kruger Street', 'Nelson Mandela Drive', 'Andrew McKenzie Street',
  'Mandelagate', 'Luthuli Street', 'Delvers Street', 'Kitchener Street',
  'Bureau Street', 'Rex Street', 'Glencoe Street', 'Strand Street',
];

const branchTypes = [
  'Main Branch', 'Central Branch', 'Regional Branch', 'Premium Branch',
  'Service Branch', 'Express Branch', 'Full Service Branch', 'Priority Branch',
  'Digital Branch', 'Retail Branch', 'Commercial Branch', 'Corporate Branch',
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function generateBranchName(area: string, city: string): string {
  const type = branchTypes[randomInt(0, branchTypes.length - 1)];
  return `${area} ${type}`;
}

function generateAddress(area: string, city: string): string {
  const streetNumber = randomInt(1, 500);
  const street = streetNames[randomInt(0, streetNames.length - 1)];
  const postalCode = randomInt(1000, 9000);
  return `${streetNumber} ${street}, ${area}, ${city}, ${postalCode}`;
}

function generateOpeningHours(): { opening: string; closing: string } {
  const openingHour = randomInt(8, 9);
  const openingMinute = Math.random() > 0.5 ? '00' : '30';
  
  const closeHour = randomInt(15, 17);
  const closeMinute = '00';
  
  const opening = `${openingHour.toString().padStart(2, '0')}:${openingMinute}:00`;
  const closing = `${closeHour.toString().padStart(2, '0')}:${closeMinute}:00`;
  
  return { opening, closing };
}

async function seed() {
  console.log('🌱 Seeding database with bank branches...\n');

  let created = 0;
  let skipped = 0;
  const targetCount = 880;

  for (let i = 0; i < targetCount; i++) {
    const cityData = cities[randomInt(0, cities.length - 1)];
    const area = cityData.areas[randomInt(0, cityData.areas.length - 1)];
    const name = generateBranchName(area, cityData.city);
    const address = generateAddress(area, cityData.city);
    const hours = generateOpeningHours();

    try {
      const result = await sql`
        INSERT INTO branches (name, address, opening_time, closing_time)
        VALUES (
          ${name},
          ${address},
          ${hours.opening}::time,
          ${hours.closing}::time
        )
        ON CONFLICT DO NOTHING
        RETURNING id
      `;
      
      if (result.length > 0) {
        created++;
        if (created % 50 === 0) {
          console.log(`  ✓ Created ${created} branches...`);
        }
      } else {
        skipped++;
      }
    } catch (error) {
      console.error(`  ✗ Failed at ${name}:`, error);
    }
  }

  console.log(`\n✨ Seeding complete!`);
  console.log(`   Created: ${created} branches`);
  console.log(`   Skipped: ${skipped} (already existed)`);
  console.log(`   Total in DB: ${created + skipped}\n`);

  await sql.end();
  process.exit(0);
}

seed().catch((error) => {
  console.error('\n❌ Seeding failed:', error);
  sql.end();
  process.exit(1);
});
