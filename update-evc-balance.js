const fetch = require('node-fetch');

async function updateEVCBalance() {
  try {
    const response = await fetch('http://localhost:5000/api/admin/balances', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-bypass': 'admin'
      },
      body: JSON.stringify({
        currency: 'evc',
        amount: 1000
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ EVC Balance updated successfully!');
      console.log(`💰 New EVC Balance: $${data.amount}`);
      console.log(`📅 Last Updated: ${data.lastUpdated}`);
    } else {
      console.log('❌ Failed to update EVC balance:', data.message);
    }
  } catch (error) {
    console.log('❌ Error updating EVC balance:', error.message);
  }
}

updateEVCBalance(); 