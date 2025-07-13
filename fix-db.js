import "dotenv/config";
import { db } from "./server/db.ts";
import { users } from "./shared/schema.ts";
import { eq } from "drizzle-orm";
import fs from 'fs';

async function fixDatabase() {
  try {
    console.log("🔧 Fixing database schema...");
    
    // Read the SQL file
    const sql = fs.readFileSync('fix-database.sql', 'utf8');
    
    // Execute the SQL
    await db.execute(sql);
    
    console.log("✅ Database schema fixed successfully!");
    
    // Test the fix by trying to create a test user
    console.log("🧪 Testing user creation...");
    
    const testUser = {
      username: "testuser123",
      email: "test123@example.com",
      phone: "1234567890",
      fullName: "Test User 123",
      password: "hashedpassword",
      role: "user"
    };
    
    try {
      const [newUser] = await db.insert(users).values(testUser).returning();
      console.log("✅ User creation test successful:", newUser.username);
      
      // Clean up
      await db.delete(users).where(eq(users.username, "testuser123"));
      console.log("🧹 Test user cleaned up");
      
    } catch (error) {
      console.error("❌ User creation test failed:", error.message);
    }
    
  } catch (error) {
    console.error("❌ Database fix failed:", error);
  } finally {
    process.exit(0);
  }
}

fixDatabase(); 