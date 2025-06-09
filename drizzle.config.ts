import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './lib/db/migrations',
  dialect: 'postgresql', // changed from 'driver: pg'
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgresql://postgres.tcfvnbayuwydkhoshfhg:8!d62N9sEs.YbZp@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres",
  },
});