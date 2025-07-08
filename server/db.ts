import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

export const db = drizzle(pool, { schema });

// Add connection test function
export async function testDatabaseConnection() {
  try {
    console.log('🔍 Testing database connection...');
    const result = await db.select().from(walletAddresses).limit(1);
    console.log('✅ Database connection successful');
    console.log(' Sample wallet data:', result);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

// Test connection on startup
testDatabaseConnection();