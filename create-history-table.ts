import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const sql = `
-- Exchange rate history table for tracking all rate changes
CREATE TABLE IF NOT EXISTS exchange_rate_history (
  id SERIAL PRIMARY KEY,
  from_currency TEXT NOT NULL,
  to_currency TEXT NOT NULL,
  old_rate DECIMAL(10,6),
  new_rate DECIMAL(10,6) NOT NULL,
  changed_by TEXT NOT NULL,
  change_reason TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
`;

async function createHistoryTable() {
  try {
    console.log('Creating exchange rate history table...');
    await pool.query(sql);
    console.log('✅ Exchange rate history table created successfully!');
  } catch (error) {
    console.error('❌ Error creating history table:', error);
  } finally {
    await pool.end();
  }
}

createHistoryTable(); 