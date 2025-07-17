// Direct database update to turn system ON
const { drizzle } = require('drizzle-orm/better-sqlite3');
const Database = require('better-sqlite3');
const { systemStatus } = require('./shared/schema');

async function updateSystemStatus() {
  try {
    console.log('Updating system status to ON...');
    
    // Connect to database
    const sqlite = new Database('./server/database.sqlite');
    const db = drizzle(sqlite);
    
    // Update system status to ON
    await db.update(systemStatus).set({ status: 'on' }).where();
    
    console.log('✅ System status updated to ON in database!');
    console.log('Users will now see real balances instead of $0');
    
    sqlite.close();
  } catch (error) {
    console.error('❌ Error updating system status:', error);
  }
}

updateSystemStatus(); 