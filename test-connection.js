// Real-time connection test between admin dashboard and website
import WebSocket from 'ws';
import fetch from 'node-fetch';

async function testRealTimeConnection() {
  console.log("🔄 Testing real-time connection between admin dashboard and website...\n");
  
  // Test 1: WebSocket Connection
  console.log("1. Testing WebSocket connection...");
  const ws = new WebSocket('ws://localhost:5000/ws');
  
  ws.on('open', () => {
    console.log("✅ WebSocket connected successfully");
  });
  
  ws.on('message', (data) => {
    const message = JSON.parse(data.toString());
    console.log("📨 Received WebSocket message:", {
      type: message.type,
      timestamp: message.timestamp,
      data: message.data
    });
  });
  
  ws.on('error', (error) => {
    console.log("❌ WebSocket error:", error.message);
  });
  
  // Test 2: Exchange Rate Update Propagation
  console.log("\n2. Testing exchange rate update propagation...");
  setTimeout(async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/exchange-rate', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromCurrency: 'zaad',
          toCurrency: 'moneygo',
          rate: 1.25
        })
      });
      
      if (response.ok) {
        console.log("✅ Exchange rate update sent successfully");
        
        // Verify the update
        setTimeout(async () => {
          const rateCheck = await fetch('http://localhost:5000/api/exchange-rate/zaad/moneygo');
          const rateData = await rateCheck.json();
          console.log("📊 Current rate:", rateData);
        }, 1000);
      }
    } catch (error) {
      console.log("❌ Exchange rate update failed:", error.message);
    }
  }, 2000);
  
  // Test 3: Balance Update Propagation
  console.log("\n3. Testing balance update propagation...");
  setTimeout(async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/balances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currency: 'ZAAD',
          amount: 55556
        })
      });
      
      if (response.ok) {
        console.log("✅ Balance update sent successfully");
        
        // Verify the update
        setTimeout(async () => {
          const balanceCheck = await fetch('http://localhost:5000/api/admin/balances');
          const balanceData = await balanceCheck.json();
          console.log("💰 Current ZAAD balance:", balanceData.ZAAD);
        }, 1000);
      }
    } catch (error) {
      console.log("❌ Balance update failed:", error.message);
    }
  }, 4000);
  
  // Test 4: Currency Limits Update Propagation
  console.log("\n4. Testing currency limits update propagation...");
  setTimeout(async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/currency-limits', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currency: 'zaad',
          minAmount: 9,
          maxAmount: 12000
        })
      });
      
      if (response.ok) {
        console.log("✅ Currency limits update sent successfully");
        
        // Verify the update
        setTimeout(async () => {
          const limitsCheck = await fetch('http://localhost:5000/api/currency-limits/zaad');
          const limitsData = await limitsCheck.json();
          console.log("📏 Current ZAAD limits:", limitsData);
        }, 1000);
      }
    } catch (error) {
      console.log("❌ Currency limits update failed:", error.message);
    }
  }, 6000);
  
  // Close WebSocket after tests
  setTimeout(() => {
    ws.close();
    console.log("\n🔚 Connection test completed");
  }, 10000);
}

testRealTimeConnection().catch(console.error);