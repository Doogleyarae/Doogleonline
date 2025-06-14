import { db } from "./db";
import { users, exchangeRates, walletAddresses } from "@shared/schema";
import { eq, and } from "drizzle-orm";

async function seedDatabase() {
  try {
    // Check if admin user already exists
    const existingAdmin = await db.select().from(users).where(eq(users.username, "admin"));
    
    if (existingAdmin.length === 0) {
      // Create default admin user
      await db.insert(users).values({
        username: "admin",
        password: "admin123",
        role: "admin"
      });
      console.log("✓ Admin user created");
    } else {
      console.log("✓ Admin user already exists");
    }

    // Seed default exchange rates (1:1 for all currencies)
    const currencies = ['zaad', 'sahal', 'evc', 'edahab', 'premier', 'moneygo', 'trx', 'trc20', 'peb20', 'usdc'];
    const defaultRates = [];

    for (const from of currencies) {
      for (const to of currencies) {
        if (from !== to) {
          // Check if rate already exists
          const existingRate = await db.select().from(exchangeRates)
            .where(and(eq(exchangeRates.fromCurrency, from), eq(exchangeRates.toCurrency, to)));
          
          if (existingRate.length === 0) {
            defaultRates.push({
              fromCurrency: from,
              toCurrency: to,
              rate: "1.00"
            });
          }
        }
      }
    }

    if (defaultRates.length > 0) {
      await db.insert(exchangeRates).values(defaultRates);
      console.log(`✓ Seeded ${defaultRates.length} default exchange rates`);
    } else {
      console.log("✓ Exchange rates already exist");
    }

    // Seed default wallet addresses
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

    const existingWallets = await db.select().from(walletAddresses);
    
    if (existingWallets.length === 0) {
      await db.insert(walletAddresses).values(defaultWallets);
      console.log(`✓ Seeded ${defaultWallets.length} default wallet addresses`);
    } else {
      console.log("✓ Wallet addresses already exist");
    }
    
    console.log("✓ Database seeded successfully");
  } catch (error) {
    console.error("✗ Error seeding database:", error);
  }
}

seedDatabase();