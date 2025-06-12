import { db } from "./db";
import { users, exchangeRates } from "@shared/schema";
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
    
    console.log("✓ Database seeded successfully");
  } catch (error) {
    console.error("✗ Error seeding database:", error);
  }
}

seedDatabase();