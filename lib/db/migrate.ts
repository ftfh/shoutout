import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

async function main() {
  console.log(process.env.DATABASE_URL)
  const migrationClient = postgres("postgresql://postgres.tcfvnbayuwydkhoshfhg:8!d62N9sEs.YbZp@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres", { max: 1 });
  const db = drizzle(migrationClient);
  
  console.log('Running migrations...');
  await migrate(db, { migrationsFolder: './lib/db/migrations' });
  console.log('Migrations completed!');
  
  await migrationClient.end();
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});