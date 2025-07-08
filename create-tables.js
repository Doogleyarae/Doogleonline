const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const sql = `
-- Create all required tables for DoogleOnline

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user'
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  order_id TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL DEFAULT '',
  phone_number TEXT NOT NULL,
  sender_account TEXT NOT NULL DEFAULT '',
  wallet_address TEXT NOT NULL,
  send_method TEXT NOT NULL,
  receive_method TEXT NOT NULL,
  send_amount DECIMAL(10,2) NOT NULL,
  receive_amount DECIMAL(10,2) NOT NULL,
  exchange_rate DECIMAL(10,6) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_wallet TEXT NOT NULL,
  hold_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Contact messages table
CREATE TABLE IF NOT EXISTS contact_messages (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  admin_response TEXT,
  response_date TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Exchange rates table
CREATE TABLE IF NOT EXISTS exchange_rates (
  id SERIAL PRIMARY KEY,
  from_currency TEXT NOT NULL,
  to_currency TEXT NOT NULL,
  rate DECIMAL(10,6) NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Currency limits table
CREATE TABLE IF NOT EXISTS currency_limits (
  id SERIAL PRIMARY KEY,
  from_currency TEXT NOT NULL,
  to_currency TEXT NOT NULL,
  min_amount DECIMAL(10,2) NOT NULL DEFAULT 5.00,
  max_amount DECIMAL(10,2) NOT NULL DEFAULT 10000.00,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Wallet addresses table
CREATE TABLE IF NOT EXISTS wallet_addresses (
  id SERIAL PRIMARY KEY,
  method TEXT NOT NULL UNIQUE,
  address TEXT NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Balances table
CREATE TABLE IF NOT EXISTS balances (
  id SERIAL PRIMARY KEY,
  currency TEXT NOT NULL UNIQUE,
  amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  order_id TEXT NOT NULL,
  type TEXT NOT NULL,
  currency TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  from_wallet TEXT NOT NULL,
  to_wallet TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Admin contact info table
CREATE TABLE IF NOT EXISTS admin_contact_info (
  id SERIAL PRIMARY KEY,
  email TEXT,
  whatsapp TEXT,
  telegram TEXT,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Customer restrictions table
CREATE TABLE IF NOT EXISTS customer_restrictions (
  id SERIAL PRIMARY KEY,
  customer_identifier TEXT NOT NULL,
  cancellation_count INTEGER NOT NULL DEFAULT 0,
  last_cancellation_at TIMESTAMP,
  restricted_until TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Email logs table
CREATE TABLE IF NOT EXISTS email_logs (
  id SERIAL PRIMARY KEY,
  order_id TEXT NOT NULL,
  email_address TEXT NOT NULL,
  email_type TEXT NOT NULL,
  sent_at TIMESTAMP NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'sent'
);

-- Insert default admin user
INSERT INTO users (username, password, role) 
VALUES ('admin', '$2a$10$rQZ8KJ9L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6A7B8C9D0E1F2G3H4I5J6K', 'admin')
ON CONFLICT (username) DO NOTHING;

-- Insert sample exchange rates
INSERT INTO exchange_rates (from_currency, to_currency, rate) VALUES
('TRC20', 'MONEYGO', 1.05),
('MONEYGO', 'TRC20', 0.95),
('ZAAD', 'EVC', 1.02),
('EVC', 'ZAAD', 0.98),
('SAHAL', 'EDAHAB', 1.01),
('EDAHAB', 'SAHAL', 0.99)
ON CONFLICT DO NOTHING;

-- Insert default wallet addresses
INSERT INTO wallet_addresses (method, address) VALUES
('TRC20', 'TQn9Y2khDD95GmYz6J4X8K7L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6A7B8C9D0E1F2G3H4I5J6K'),
('MONEYGO', 'MG123456789012345678901234567890'),
('ZAAD', '252612345678'),
('EVC', '252612345679'),
('SAHAL', '252612345680'),
('EDAHAB', '252612345681'),
('PREMIER', '1234567890'),
('TRX', 'TQn9Y2khDD95GmYz6J4X8K7L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6A7B8C9D0E1F2G3H4I5J6K'),
('PEB20', '0x1234567890123456789012345678901234567890'),
('USDC', '0x1234567890123456789012345678901234567890')
ON CONFLICT (method) DO NOTHING;

-- Insert default balances
INSERT INTO balances (currency, amount) VALUES
('TRC20', 10000.00),
('MONEYGO', 10000.00),
('ZAAD', 10000.00),
('EVC', 10000.00),
('SAHAL', 10000.00),
('EDAHAB', 10000.00),
('PREMIER', 10000.00),
('TRX', 10000.00),
('PEB20', 10000.00),
('USDC', 10000.00)
ON CONFLICT (currency) DO NOTHING;
`;

async function createTables() {
  try {
    console.log('Creating database tables...');
    await pool.query(sql);
    console.log('✅ All tables created successfully!');
    console.log('✅ Sample data inserted!');
  } catch (error) {
    console.error('❌ Error creating tables:', error);
  } finally {
    await pool.end();
  }
}

createTables(); 