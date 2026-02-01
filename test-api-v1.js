const http = require('http');

// Helper function to make HTTP requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const parsedBody = JSON.parse(body);
          resolve({ statusCode: res.statusCode, body: parsedBody });
        } catch (e) {
          resolve({ statusCode: res.statusCode, body: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Test data storage
const testData = {
  customer: null,
  customerToken: null,
  captain: null,
  captainToken: null,
  seller: null,
  sellerToken: null,
  store: null,
  product: null,
  ride: null,
};

console.log('🧪 Pruebas de API v1 - Ejecutando\n');

async function testAuth() {
  console.log('📱 AUTENTICACIÓN\n');

  // Test 1: Create/Login customer
  console.log('1. Creando/Login customer...');
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/v1/auth/signin',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, {
      phone: '+525559999999',
      role: 'customer',
      name: 'Juan',
      lastName: 'Pérez García',
      email: 'juan@example.com',
      dateOfBirth: '1990-01-15',
      gender: 'male',
    });

    if (response.statusCode === 201 || response.statusCode === 200) {
      console.log(`✅ Customer ${response.statusCode === 201 ? 'creado' : 'login'} exitosamente`);
      testData.customer = response.body.user;
      testData.customerToken = response.body.access_token;
      console.log(`   ID: ${testData.customer._id}`);
      console.log(`   Nombre: ${testData.customer.profile.name} ${testData.customer.profile.lastName}`);
      console.log(`   Token: ${testData.customerToken.substring(0, 50)}...\n`);
    } else {
      console.log('❌ Error:', response.statusCode, response.body.msg || response.body, '\n');
    }
  } catch (error) {
    console.log('❌ Error en la petición:', error.message, '\n');
  }

  // Test 2: Create/Login captain with DNI
  console.log('2. Creando/Login captain con DNI...');
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/v1/auth/signin',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, {
      phone: '+525558888888',
      role: 'captain',
      name: 'Carlos',
      lastName: 'Gómez López',
      email: 'carlos@example.com',
      dni: '87654321',
      dateOfBirth: '1985-05-20',
      gender: 'male',
    });

    if (response.statusCode === 201 || response.statusCode === 200) {
      console.log(`✅ Captain ${response.statusCode === 201 ? 'creado' : 'login'} exitosamente`);
      testData.captain = response.body.user;
      testData.captainToken = response.body.access_token;
      console.log(`   ID: ${testData.captain._id}`);
      console.log(`   DNI: ${testData.captain.profile.dni}`);
      console.log(`   Token: ${testData.captainToken.substring(0, 50)}...\n`);
    } else {
      console.log('❌ Error:', response.statusCode, response.body.msg || response.body, '\n');
    }
  } catch (error) {
    console.log('❌ Error en la petición:', error.message, '\n');
  }

  // Test 3: Create/Login seller
  console.log('3. Creando/Login seller...');
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/v1/auth/signin',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, {
      phone: '+525557777777',
      role: 'store_owner',
      name: 'María',
      lastName: 'López Sánchez',
      email: 'maria@tienda.com',
    });

    if (response.statusCode === 201 || response.statusCode === 200) {
      console.log(`✅ Seller ${response.statusCode === 201 ? 'creado' : 'login'} exitosamente`);
      testData.seller = response.body.user;
      testData.sellerToken = response.body.access_token;
      console.log(`   ID: ${testData.seller._id}`);
      console.log(`   Token: ${testData.sellerToken.substring(0, 50)}...\n`);
    } else {
      console.log('❌ Error:', response.statusCode, response.body.msg || response.body, '\n');
    }
  } catch (error) {
    console.log('❌ Error en la petición:', error.message, '\n');
  }
}

async function testCaptains() {
  console.log('🚗 CAPITANES\n');

  if (!testData.captainToken) {
    console.log('⚠️  Saltando pruebas de capitanes - No token disponible\n');
    return;
  }

  // Test 4: Get captain profile
  console.log('4. Obteniendo perfil de captain...');
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/v1/captains/profile',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testData.captainToken}`,
      },
    });

    if (response.statusCode === 200) {
      console.log('✅ Perfil de captain obtenido');
      console.log(`   Nombre: ${response.body.captain.profile.name} ${response.body.captain.profile.lastName}`);
      console.log(`   DNI: ${response.body.captain.profile.dni}`);
      console.log(`   Precio por km (auto): ${response.body.captain.captain.pricePerKm.auto}\n`);
    } else {
      console.log('❌ Error:', response.statusCode, response.body.msg || response.body, '\n');
    }
  } catch (error) {
    console.log('❌ Error en la petición:', error.message, '\n');
  }

  // Test 5: Update captain pricing
  console.log('5. Actualizando precios por km del captain...');
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/v1/captains/pricing',
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testData.captainToken}`,
      },
    }, {
      pricePerKm: {
        bike: 160,
        auto: 170,
        car: 280,
      },
    });

    if (response.statusCode === 200) {
      console.log('✅ Precios actualizados exitosamente');
      console.log(`   Nuevos precios: ${JSON.stringify(response.body.captain.pricePerKm)}\n`);
    } else {
      console.log('❌ Error:', response.statusCode, response.body.msg || response.body, '\n');
    }
  } catch (error) {
    console.log('❌ Error en la petición:', error.message, '\n');
  }

  // Test 6: Get captain by ID (public endpoint)
  if (testData.captain) {
    console.log('6. Obteniendo captain por ID (público)...');
    try {
      const response = await makeRequest({
        hostname: 'localhost',
        port: 3000,
        path: `/api/v1/captains/${testData.captain._id}/profile`,
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.statusCode === 200) {
        console.log('✅ Captain obtenido por ID (público)');
        console.log(`   Nombre: ${response.body.captain.profile.name} ${response.body.captain.profile.lastName}\n`);
      } else {
        console.log('❌ Error:', response.statusCode, '\n');
      }
    } catch (error) {
      console.log('❌ Error en la petición:', error.message, '\n');
    }
  }
}

async function testSellers() {
  console.log('🏪 VENDEDORES\n');

  if (!testData.sellerToken) {
    console.log('⚠️  Saltando pruebas de vendedores - No token disponible\n');
    return;
  }

  // Test 7: Get seller profile
  console.log('7. Obteniendo perfil de seller...');
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/v1/sellers/profile',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testData.sellerToken}`,
      },
    });

    if (response.statusCode === 200) {
      console.log('✅ Perfil de seller obtenido');
      console.log(`   Nombre: ${response.body.seller.profile.name} ${response.body.seller.profile.lastName}`);
      console.log(`   Email: ${response.body.seller.profile.email}\n`);
    } else {
      console.log('❌ Error:', response.statusCode, response.body.msg || response.body, '\n');
    }
  } catch (error) {
    console.log('❌ Error en la petición:', error.message, '\n');
  }

  // Test 8: Update seller profile
  console.log('8. Actualizando perfil de seller...');
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/v1/sellers/profile',
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testData.sellerToken}`,
      },
    }, {
      businessName: 'Tienda María',
      taxId: 'ABC123456XYZ',
    });

    if (response.statusCode === 200) {
      console.log('✅ Perfil de seller actualizado');
      console.log(`   Nombre del negocio: ${response.body.seller.seller.businessName}`);
      console.log(`   RFC/NIT: ${response.body.seller.seller.taxId}\n`);
    } else {
      console.log('❌ Error:', response.statusCode, response.body.msg || response.body, '\n');
    }
  } catch (error) {
    console.log('❌ Error en la petición:', error.message, '\n');
  }

  // Test 9: Get seller by ID (public endpoint)
  if (testData.seller) {
    console.log('9. Obteniendo seller por ID (público)...');
    try {
      const response = await makeRequest({
        hostname: 'localhost',
        port: 3000,
        path: `/api/v1/sellers/${testData.seller._id}/profile`,
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.statusCode === 200) {
        console.log('✅ Seller obtenido por ID (público)\n');
      } else {
        console.log('❌ Error:', response.statusCode, '\n');
      }
    } catch (error) {
      console.log('❌ Error en la petición:', error.message, '\n');
    }
  }
}

async function testProducts() {
  console.log('📦 PRODUCTOS\n');

  // Test 10: Get product categories
  console.log('10. Obteniendo categorías de productos...');
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/v1/products/categories',
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.statusCode === 200) {
      console.log('✅ Categorías obtenidas');
      console.log(`   Total: ${response.body.categories.length}`);
      console.log(`   Categorías: ${response.body.categories.join(', ')}\n`);
    } else {
      console.log('❌ Error:', response.statusCode, '\n');
    }
  } catch (error) {
    console.log('❌ Error en la petición:', error.message, '\n');
  }
}

async function testRides() {
  console.log('🚕 RIDES\n');

  if (!testData.customerToken) {
    console.log('⚠️  Saltando pruebas de rides - No token de customer disponible\n');
    return;
  }

  // Test 11: Create a ride
  console.log('11. Creando un ride...');
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/v1/rides/create',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testData.customerToken}`,
      },
    }, {
      vehicle: 'auto',
      pickup: {
        address: 'Calle Principal 123',
        latitude: 19.4326,
        longitude: -99.1332,
      },
      drop: {
        address: 'Avenida Reforma 456',
        latitude: 19.4350,
        longitude: -99.1350,
      },
    });

    if (response.statusCode === 201) {
      console.log('✅ Ride creado exitosamente');
      testData.ride = response.body.ride;
      console.log(`   Ride ID: ${testData.ride._id}`);
      console.log(`   Tarifa: $${testData.ride.fare}`);
      console.log(`   Distancia: ${testData.ride.distance} km`);
      console.log(`   OTP: ${testData.ride.otp}\n`);
    } else {
      console.log('❌ Error:', response.statusCode, response.body.msg || response.body, '\n');
    }
  } catch (error) {
    console.log('❌ Error en la petición:', error.message, '\n');
  }

  // Test 12: Get my rides
  console.log('12. Obteniendo mis rides...');
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/v1/rides',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testData.customerToken}`,
      },
    });

    if (response.statusCode === 200) {
      console.log('✅ Rides obtenidos');
      console.log(`   Total: ${response.body.count}\n`);
    } else {
      console.log('❌ Error:', response.statusCode, response.body.msg || response.body, '\n');
    }
  } catch (error) {
    console.log('❌ Error en la petición:', error.message, '\n');
  }
}

async function runAllTests() {
  await testAuth();
  await testCaptains();
  await testSellers();
  await testProducts();
  await testRides();

  console.log('📊 RESUMEN:');
  console.log(`   Customer ID: ${testData.customer?._id || 'N/A'}`);
  console.log(`   Captain ID: ${testData.captain?._id || 'N/A'}`);
  console.log(`   Seller ID: ${testData.seller?._id || 'N/A'}`);
  console.log(`   Ride ID: ${testData.ride?._id || 'N/A'}`);
  console.log('\n✅ Pruebas completadas');
}

runAllTests().catch(console.error);
