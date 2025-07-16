import "dotenv/config";
import { db } from "./db";
import { users, exchangeRates, walletAddresses, systemStatus, balances } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function seedDatabase() {
  try {
    // Upsert admin user with strong password
    const adminUsername = "admin";
    const adminPassword = await bcrypt.hash("admin123", 10);
    const existingAdmin = await db.select().from(users).where(eq(users.username, adminUsername));
    if (existingAdmin.length === 0) {
      await db.insert(users).values({
        username: adminUsername,
        email: "admin@doogleonline.com",
        phone: "1234567890",
        fullName: "Admin User",
        password: adminPassword,
        role: "admin"
      });
      console.log("✓ Admin user created");
    } else {
      await db.update(users)
        .set({ password: adminPassword, role: "admin" })
        .where(eq(users.username, adminUsername));
      console.log("✓ Admin user password updated");
    }

    // Add sample users
    const sampleUsers = [
      { 
        username: "user1", 
        email: "user1@example.com",
        phone: "1234567891",
        fullName: "Sample User 1",
        password: "User1Pass!2024", 
        role: "user" 
      },
      { 
        username: "user2", 
        email: "user2@example.com",
        phone: "1234567892",
        fullName: "Sample User 2",
        password: "User2Pass!2024", 
        role: "user" 
      }
    ];
    for (const user of sampleUsers) {
      const exists = await db.select().from(users).where(eq(users.username, user.username));
      if (exists.length === 0) {
        await db.insert(users).values(user);
        console.log(`✓ Sample user created: ${user.username}`);
      }
    }

    // Seed realistic exchange rates
    const currencies = ['zaad', 'sahal', 'evc', 'edahab', 'premier', 'moneygo', 'trx', 'trc20', 'peb20', 'usdc'];
    
    // Define realistic exchange rates (base currency: USD equivalent)
    const realisticRates = [
      // TRC20 (USDT) to others (1 USDT = 1 USD)
      { from: 'trc20', to: 'zaad', rate: '1.05' },
      { from: 'trc20', to: 'sahal', rate: '1.05' },
      { from: 'trc20', to: 'evc', rate: '1.05' },
      { from: 'trc20', to: 'edahab', rate: '1.05' },
      { from: 'trc20', to: 'premier', rate: '1.05' },
      { from: 'trc20', to: 'moneygo', rate: '1.20' },
      { from: 'trc20', to: 'trx', rate: '0.95' },
      { from: 'trc20', to: 'peb20', rate: '1.00' },
      { from: 'trc20', to: 'usdc', rate: '1.00' },
      
      // MoneyGo to others (1 MoneyGo = 0.83 USD)
      { from: 'moneygo', to: 'trc20', rate: '0.83' },
      { from: 'moneygo', to: 'zaad', rate: '0.87' },
      { from: 'moneygo', to: 'sahal', rate: '0.87' },
      { from: 'moneygo', to: 'evc', rate: '0.87' },
      { from: 'moneygo', to: 'edahab', rate: '0.87' },
      { from: 'moneygo', to: 'premier', rate: '0.87' },
      { from: 'moneygo', to: 'trx', rate: '0.79' },
      { from: 'moneygo', to: 'peb20', rate: '0.83' },
      { from: 'moneygo', to: 'usdc', rate: '0.83' },
      
      // EVC to others (1 EVC = 0.95 USD)
      { from: 'evc', to: 'trc20', rate: '0.95' },
      { from: 'evc', to: 'moneygo', rate: '1.14' },
      { from: 'evc', to: 'zaad', rate: '1.00' },
      { from: 'evc', to: 'sahal', rate: '1.00' },
      { from: 'evc', to: 'edahab', rate: '1.00' },
      { from: 'evc', to: 'premier', rate: '1.00' },
      { from: 'evc', to: 'trx', rate: '0.90' },
      { from: 'evc', to: 'peb20', rate: '0.95' },
      { from: 'evc', to: 'usdc', rate: '0.95' },
      
      // Zaad to others (1 Zaad = 0.95 USD)
      { from: 'zaad', to: 'trc20', rate: '0.95' },
      { from: 'zaad', to: 'moneygo', rate: '1.14' },
      { from: 'zaad', to: 'evc', rate: '1.00' },
      { from: 'zaad', to: 'sahal', rate: '1.00' },
      { from: 'zaad', to: 'edahab', rate: '1.00' },
      { from: 'zaad', to: 'premier', rate: '1.00' },
      { from: 'zaad', to: 'trx', rate: '0.90' },
      { from: 'zaad', to: 'peb20', rate: '0.95' },
      { from: 'zaad', to: 'usdc', rate: '0.95' },
      
      // Sahal to others (1 Sahal = 0.95 USD)
      { from: 'sahal', to: 'trc20', rate: '0.95' },
      { from: 'sahal', to: 'moneygo', rate: '1.14' },
      { from: 'sahal', to: 'evc', rate: '1.00' },
      { from: 'sahal', to: 'zaad', rate: '1.00' },
      { from: 'sahal', to: 'edahab', rate: '1.00' },
      { from: 'sahal', to: 'premier', rate: '1.00' },
      { from: 'sahal', to: 'trx', rate: '0.90' },
      { from: 'sahal', to: 'peb20', rate: '0.95' },
      { from: 'sahal', to: 'usdc', rate: '0.95' },
      
      // eDahab to others (1 eDahab = 0.95 USD)
      { from: 'edahab', to: 'trc20', rate: '0.95' },
      { from: 'edahab', to: 'moneygo', rate: '1.14' },
      { from: 'edahab', to: 'evc', rate: '1.00' },
      { from: 'edahab', to: 'zaad', rate: '1.00' },
      { from: 'edahab', to: 'sahal', rate: '1.00' },
      { from: 'edahab', to: 'premier', rate: '1.00' },
      { from: 'edahab', to: 'trx', rate: '0.90' },
      { from: 'edahab', to: 'peb20', rate: '0.95' },
      { from: 'edahab', to: 'usdc', rate: '0.95' },
      
      // Premier Bank to others (1 Premier = 0.95 USD)
      { from: 'premier', to: 'trc20', rate: '0.95' },
      { from: 'premier', to: 'moneygo', rate: '1.14' },
      { from: 'premier', to: 'evc', rate: '1.00' },
      { from: 'premier', to: 'zaad', rate: '1.00' },
      { from: 'premier', to: 'sahal', rate: '1.00' },
      { from: 'premier', to: 'edahab', rate: '1.00' },
      { from: 'premier', to: 'trx', rate: '0.90' },
      { from: 'premier', to: 'peb20', rate: '0.95' },
      { from: 'premier', to: 'usdc', rate: '0.95' },
      
      // TRX to others (1 TRX = 1.05 USD)
      { from: 'trx', to: 'trc20', rate: '1.05' },
      { from: 'trx', to: 'moneygo', rate: '1.26' },
      { from: 'trx', to: 'evc', rate: '1.11' },
      { from: 'trx', to: 'zaad', rate: '1.11' },
      { from: 'trx', to: 'sahal', rate: '1.11' },
      { from: 'trx', to: 'edahab', rate: '1.11' },
      { from: 'trx', to: 'premier', rate: '1.11' },
      { from: 'trx', to: 'peb20', rate: '1.05' },
      { from: 'trx', to: 'usdc', rate: '1.05' },
      
      // PEB20 to others (1 PEB20 = 1.00 USD)
      { from: 'peb20', to: 'trc20', rate: '1.00' },
      { from: 'peb20', to: 'moneygo', rate: '1.20' },
      { from: 'peb20', to: 'evc', rate: '1.05' },
      { from: 'peb20', to: 'zaad', rate: '1.05' },
      { from: 'peb20', to: 'sahal', rate: '1.05' },
      { from: 'peb20', to: 'edahab', rate: '1.05' },
      { from: 'peb20', to: 'premier', rate: '1.05' },
      { from: 'peb20', to: 'trx', rate: '0.95' },
      { from: 'peb20', to: 'usdc', rate: '1.00' },
      
      // USDC to others (1 USDC = 1.00 USD)
      { from: 'usdc', to: 'trc20', rate: '1.00' },
      { from: 'usdc', to: 'moneygo', rate: '1.20' },
      { from: 'usdc', to: 'evc', rate: '1.05' },
      { from: 'usdc', to: 'zaad', rate: '1.05' },
      { from: 'usdc', to: 'sahal', rate: '1.05' },
      { from: 'usdc', to: 'edahab', rate: '1.05' },
      { from: 'usdc', to: 'premier', rate: '1.05' },
      { from: 'usdc', to: 'trx', rate: '0.95' },
      { from: 'usdc', to: 'peb20', rate: '1.00' }
    ];

    // Delete all exchange rates before inserting
    await db.delete(exchangeRates);
    for (const rate of realisticRates) {
      await db
        .insert(exchangeRates)
        .values({
          fromCurrency: rate.from,
          toCurrency: rate.to,
          rate: rate.rate
        });
    }
    console.log(`✓ Seeded ${realisticRates.length} realistic exchange rates`);

    // Seed initial balances for all currencies
    const initialBalances = [
      { currency: 'zaad', amount: '5000.00' },
      { currency: 'sahal', amount: '5000.00' },
      { currency: 'evc', amount: '5000.00' },
      { currency: 'edahab', amount: '5000.00' },
      { currency: 'premier', amount: '5000.00' },
      { currency: 'moneygo', amount: '5000.00' },
      { currency: 'trx', amount: '5000.00' },
      { currency: 'trc20', amount: '5000.00' },
      { currency: 'peb20', amount: '5000.00' },
      { currency: 'usdc', amount: '5000.00' }
    ];

    // Delete all balances before inserting
    await db.delete(balances);
    for (const balance of initialBalances) {
      await db.insert(balances).values(balance);
    }
    console.log(`✓ Seeded initial balances for ${initialBalances.length} currencies`);

    // Enhanced wallet addresses seeding
    const defaultWallets = [
      { method: 'zaad', address: '*880*637834431*amount#' },
      { method: 'sahal', address: '*883*905865292*amount#' },
      { method: 'evc', address: '*799*34996012*amount#' },
      { method: 'edahab', address: '0626451011' },
      { method: 'premier', address: '0616451011' },
      { method: 'moneygo', address: 'U2778451' },
      { method: 'trx', address: 'THspUcX2atLi7e4cQdMLqNBrn13RrNaRkv' },
      { method: 'trc20', address: 'THspUcX2atLi7e4cQdMLqNBrn13RrNaRkv' },
      { method: 'peb20', address: '0x5f3c72277de38d91e12f6f594ac8353c21d73c83' }
    ];

    // Enhanced seeding with better error handling
    try {
      const existingWallets = await db.select().from(walletAddresses);
      console.log(`📊 Found ${existingWallets.length} existing wallet addresses`);
      
      if (existingWallets.length === 0) {
        console.log('🌱 Seeding wallet addresses...');
        await db.insert(walletAddresses).values(defaultWallets);
        console.log(`✅ Seeded ${defaultWallets.length} default wallet addresses`);
      } else {
        console.log('✅ Wallet addresses already exist, skipping seed');
        
        // Update any missing wallet addresses
        for (const defaultWallet of defaultWallets) {
          const exists = existingWallets.find(w => w.method === defaultWallet.method);
          if (!exists) {
            console.log(`➕ Adding missing wallet: ${defaultWallet.method}`);
            await db.insert(walletAddresses).values(defaultWallet);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error seeding wallet addresses:', error);
      throw error;
    }
    
    console.log("✓ Database seeded successfully");
  } catch (error) {
    console.error("✗ Error seeding database:", error);
  }
}

async function seedSystemStatus() {
  const existing = await db.select().from(systemStatus).limit(1);
  if (!existing.length) {
    await db.insert(systemStatus).values({ status: 'on' });
    console.log('Seeded system_status with status: on');
  }
}

async function main() {
  await seedDatabase();
  await seedSystemStatus();
}

main();