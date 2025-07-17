// Simple script to turn system status ON
const fetch = require('node-fetch');

async function turnSystemOn() {
  try {
    console.log('Turning system status ON...');
    
    const response = await fetch('http://localhost:3001/api/admin/system-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-bypass': 'admin-token' // Using bypass token
      },
      body: JSON.stringify({ status: 'on' })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ System status turned ON successfully!');
      console.log('Status:', data.status);
      console.log('Users will now see real balances instead of $0');
    } else {
      const error = await response.text();
      console.error('❌ Failed to turn system ON:', error);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

turnSystemOn(); 