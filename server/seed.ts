import "dotenv/config";
import { db } from "./db";
import { users, exchangeRates, walletAddresses, systemStatus } from "@shared/schema";
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
      { username: "user1", password: "User1Pass!2024", role: "user" },
      { username: "user2", password: "User2Pass!2024", role: "user" }
    ];
    for (const user of sampleUsers) {
      const exists = await db.select().from(users).where(eq(users.username, user.username));
      if (exists.length === 0) {
        await db.insert(users).values(user);
        console.log(`✓ Sample user created: ${user.username}`);
      }
    }

    // Seed default exchange rates (1:1 for all currencies)
    const currencies = ['zaad', 'sahal', 'evc', 'edahab', 'premier', 'moneygo', 'trx', 'trc20', 'peb20', 'usdc'];
    const defaultRates = [];

    for (const from of currencies) {
      for (const to of currencies) {
        if (from !== to) {
            defaultRates.push({
              fromCurrency: from,
              toCurrency: to,
              rate: "1.00"
            });
          }
        }
      }

    // Insert all rates if not present
    for (const rate of defaultRates) {
      await db
        .insert(exchangeRates)
        .values(rate)
        .onConflictDoUpdate({
          target: [exchangeRates.fromCurrency, exchangeRates.toCurrency],
          set: { 
            rate: rate.rate, 
            updatedAt: new Date()
          }
        });
    }

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