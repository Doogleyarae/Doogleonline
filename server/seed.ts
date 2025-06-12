import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

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
    
    console.log("✓ Database seeded successfully");
  } catch (error) {
    console.error("✗ Error seeding database:", error);
  }
}

seedDatabase();