import "dotenv/config";
import { db } from "./server/db.ts";
import { users } from "./shared/schema.ts";
import { eq } from "drizzle-orm";

async function testDatabase() {
  try {
    console.log("Testing database connection...");
    
    // Test basic connection
    const result = await db.select().from(users).limit(1);
    console.log("Database connection successful!");
    console.log("Users table exists and is accessible");
    console.log("Sample user data:", result);
    
    // Test schema by trying to insert a test user
    console.log("\nTesting user creation...");
    const testUser = {
      username: "testuser",
      email: "test@example.com",
      phone: "1234567890",
      fullName: "Test User",
      password: "hashedpassword",
      role: "user"
    };
    
    try {
      const [newUser] = await db.insert(users).values(testUser).returning();
      console.log("User creation successful:", newUser);
      
      // Clean up - delete the test user
      await db.delete(users).where(eq(users.username, "testuser"));
      console.log("Test user cleaned up");
    } catch (error) {
      console.error("User creation failed:", error.message);
    }
    
  } catch (error) {
    console.error("Database test failed:", error);
  } finally {
    process.exit(0);
  }
}

testDatabase(); 