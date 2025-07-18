async function debugSession() {
  console.log('🔍 Debugging Session Management...\n');
  
  try {
    // Step 1: Test session creation
    console.log('1️⃣ Testing session creation...');
    const sessionResponse = await fetch('http://localhost:5000/api/test-session', {
      credentials: 'include'
    });

    if (sessionResponse.ok) {
      const sessionData = await sessionResponse.json();
      console.log('✅ Session test result:', sessionData);
    } else {
      console.log('❌ Session test failed:', sessionResponse.status);
    }

    // Step 2: Test admin login
    console.log('\n2️⃣ Testing admin login...');
    const loginResponse = await fetch('http://localhost:5000/api/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'Doogle',
        password: 'Aa121322@Doogle143'
      }),
      credentials: 'include'
    });

    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Admin login result:', loginData);
      
      // Step 3: Test session persistence immediately after login
      console.log('\n3️⃣ Testing session persistence after login...');
      const authResponse = await fetch('http://localhost:5000/api/admin/check-auth', {
        credentials: 'include'
      });

      if (authResponse.ok) {
        const authData = await authResponse.json();
        console.log('✅ Session check after login:', authData);
        
        if (authData.authenticated) {
          console.log('🎉 Session is working!');
          
          // Step 4: Test admin functionality
          console.log('\n4️⃣ Testing admin functionality...');
          const rateResponse = await fetch('http://localhost:5000/api/admin/exchange-rates', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
              fromCurrency: 'TRC20',
              toCurrency: 'MONEYGO',
              rate: '1.300000',
              changedBy: 'admin'
            })
          });

          if (rateResponse.ok) {
            const rateData = await rateResponse.json();
            console.log('✅ Exchange rate update successful:', rateData);
          } else {
            const errorData = await rateResponse.json();
            console.log('❌ Exchange rate update failed:', errorData);
          }
        } else {
          console.log('❌ Session authentication failed after login');
          console.log('Session data:', authData);
        }
      } else {
        const errorData = await authResponse.json();
        console.log('❌ Session check failed:', errorData);
      }
      
    } else {
      const errorData = await loginResponse.json();
      console.log('❌ Admin login failed:', errorData);
    }

    // Step 5: Test health endpoint
    console.log('\n5️⃣ Testing health endpoint...');
    const healthResponse = await fetch('http://localhost:5000/api/health', {
      credentials: 'include'
    });

    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Health check result:', healthData);
    } else {
      console.log('❌ Health check failed:', healthResponse.status);
    }

    console.log('\n🎉 Session debugging completed!');

  } catch (error) {
    console.log('❌ Error during session debugging:', error.message);
  }
}

debugSession(); 