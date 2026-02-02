const http = require('http');
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
                }
                catch (e) {
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
const authData = {
    customerPhone: '+525559999999',
    captainPhone: '+525558888888',
    sellerPhone: '+525557777777',
};
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
    delivery: null,
};
console.log('🧪 Pruebas Completas de API v1 - Tiendas, Productos y Más\n');
async function signInUsers() {
    console.log('📱 LOGUEANDO USUARIOS\n');
    console.log('1. Logueando customer...');
    try {
        const response = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/v1/auth/signin',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        }, {
            phone: authData.customerPhone,
            role: 'customer',
        });
        if (response.statusCode === 200 || response.statusCode === 201) {
            testData.customerToken = response.body.access_token;
            console.log('✅ Customer logueado\n');
        }
    }
    catch (error) {
        console.log('❌ Error:', error.message, '\n');
    }
    console.log('2. Logueando captain...');
    try {
        const response = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/v1/auth/signin',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        }, {
            phone: authData.captainPhone,
            role: 'captain',
        });
        if (response.statusCode === 200 || response.statusCode === 201) {
            testData.captainToken = response.body.access_token;
            testData.captain = response.body.user;
            console.log('✅ Captain logueado\n');
        }
    }
    catch (error) {
        console.log('❌ Error:', error.message, '\n');
    }
    console.log('3. Logueando seller...');
    try {
        const response = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/v1/auth/signin',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        }, {
            phone: authData.sellerPhone,
            role: 'store_owner',
        });
        if (response.statusCode === 200 || response.statusCode === 201) {
            testData.sellerToken = response.body.access_token;
            testData.seller = response.body.user;
            console.log('✅ Seller logueado\n');
        }
    }
    catch (error) {
        console.log('❌ Error:', error.message, '\n');
    }
}
async function testStores() {
    console.log('🏪 TIENDAS\n');
    console.log('4. Creando una tienda...');
    try {
        const response = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/v1/stores/register',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${testData.sellerToken}`,
            },
        }, {
            name: 'Tienda María - Sucursal Centro',
            description: 'La mejor tienda del centro con productos de calidad',
            address: {
                street: 'Avenida Juárez 123',
                city: 'Ciudad de México',
                state: 'CDMX',
                country: 'MX',
                postalCode: '06600',
                latitude: 19.4326,
                longitude: -99.1332,
            },
            contact: {
                phone: '+52555111222',
                email: 'sucursal@maria.com',
            },
            categories: ['Comida y Bebidas', 'Hogar y Decoración'],
            deliveryFee: 25,
            minimumOrderAmount: 100,
            averageDeliveryTime: 30,
            taxRate: 0.16,
        });
        if (response.statusCode === 201) {
            console.log('✅ Tienda creada exitosamente');
            testData.store = response.body.store;
            console.log(`   ID: ${testData.store._id}`);
            console.log(`   Nombre: ${testData.store.name}`);
            console.log(`   Categorías: ${testData.store.categories.join(', ')}\n`);
        }
        else {
            console.log('❌ Error:', response.statusCode, response.body.msg || response.body, '\n');
        }
    }
    catch (error) {
        console.log('❌ Error en la petición:', error.message, '\n');
    }
    console.log('5. Obteniendo mis tiendas...');
    try {
        const response = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/v1/stores/my-stores',
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${testData.sellerToken}`,
            },
        });
        if (response.statusCode === 200) {
            console.log('✅ Tiendas obtenidas');
            console.log(`   Total: ${response.body.count}\n`);
        }
        else {
            console.log('❌ Error:', response.statusCode, '\n');
        }
    }
    catch (error) {
        console.log('❌ Error en la petición:', error.message, '\n');
    }
    if (testData.store) {
        console.log('6. Obteniendo tienda por ID (público)...');
        try {
            const response = await makeRequest({
                hostname: 'localhost',
                port: 3000,
                path: `/api/v1/stores/${testData.store._id}`,
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });
            if (response.statusCode === 200) {
                console.log('✅ Tienda obtenida por ID (público)\n');
            }
            else {
                console.log('❌ Error:', response.statusCode, '\n');
            }
        }
        catch (error) {
            console.log('❌ Error en la petición:', error.message, '\n');
        }
    }
}
async function testProducts() {
    console.log('📦 PRODUCTOS\n');
    if (!testData.store || !testData.sellerToken) {
        console.log('⚠️  Saltando pruebas de productos - Tienda o token no disponible\n');
        return;
    }
    console.log('7. Creando producto de comida (con hechos nutricionales)...');
    try {
        const response = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: `/api/v1/products/store/${testData.store._id}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${testData.sellerToken}`,
            },
        }, {
            name: 'Hamburguesa Especial',
            description: 'Deliciosa hamburguesa con queso, tocino y vegetales frescos',
            price: 150,
            category: 'Comida y Bebidas',
            images: ['https://example.com/burger1.jpg', 'https://example.com/burger2.jpg'],
            thumbnail: 'https://example.com/burger-thumb.jpg',
            weight: 0.5,
            dimensions: {
                length: 15,
                width: 10,
                height: 5,
            },
            inventory: 50,
            lowInventoryThreshold: 10,
            tags: ['hamburguesa', 'comida rápida', 'carne'],
            nutritionFacts: {
                calories: 550,
                protein: 25,
                carbs: 35,
                fat: 22,
                fiber: 3,
                sugar: 8,
                sodium: 800,
            },
        });
        if (response.statusCode === 201) {
            console.log('✅ Producto creado exitosamente');
            console.log(`   Nombre: ${response.body.product.name}`);
            console.log(`   Categoría: ${response.body.product.category}`);
            console.log(`   Precio: $${response.body.product.price}`);
            console.log(`   Calorías: ${response.body.product.nutritionFacts.calories}\n`);
        }
        else {
            console.log('❌ Error:', response.statusCode, response.body.msg || response.body, '\n');
        }
    }
    catch (error) {
        console.log('❌ Error en la petición:', error.message, '\n');
    }
    console.log('8. Creando producto no alimenticio (sin hechos nutricionales)...');
    try {
        const response = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: `/api/v1/products/store/${testData.store._id}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${testData.sellerToken}`,
            },
        }, {
            name: 'Camiseta de Algodón',
            description: 'Camiseta 100% algodón, cómoda y elegante',
            price: 250,
            category: 'Ropa y Accesorios',
            images: ['https://example.com/tshirt.jpg'],
            thumbnail: 'https://example.com/tshirt-thumb.jpg',
            weight: 0.2,
            dimensions: {
                length: 50,
                width: 30,
                height: 2,
            },
            inventory: 30,
        });
        if (response.statusCode === 201) {
            testData.product = response.body.product;
            console.log('✅ Producto no alimenticio creado exitosamente');
            console.log(`   Nombre: ${response.body.product.name}`);
            console.log(`   Categoría: ${response.body.product.category}`);
            console.log(`   Precio: $${response.body.product.price}`);
            console.log(`   Tiene nutrición: ${response.body.product.nutritionFacts ? 'No' : 'Sí (opcional)'}\n`);
        }
        else {
            console.log('❌ Error:', response.statusCode, response.body.msg || response.body, '\n');
        }
    }
    catch (error) {
        console.log('❌ Error en la petición:', error.message, '\n');
    }
    console.log('9. Obteniendo productos de la tienda...');
    try {
        const response = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: `/api/v1/products/store/${testData.store._id}`,
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });
        if (response.statusCode === 200) {
            console.log('✅ Productos de tienda obtenidos');
            console.log(`   Total: ${response.body.count}\n`);
        }
        else {
            console.log('❌ Error:', response.statusCode, '\n');
        }
    }
    catch (error) {
        console.log('❌ Error en la petición:', error.message, '\n');
    }
    if (testData.product) {
        console.log('10. Actualizando producto...');
        try {
            const response = await makeRequest({
                hostname: 'localhost',
                port: 3000,
                path: `/api/v1/products/${testData.product._id}`,
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${testData.sellerToken}`,
                },
            }, {
                price: 280,
                inventory: 45,
            });
            if (response.statusCode === 200) {
                console.log('✅ Producto actualizado');
                console.log(`   Nuevo precio: $${response.body.product.price}`);
                console.log(`   Nuevo inventario: ${response.body.product.inventory}\n`);
            }
            else {
                console.log('❌ Error:', response.statusCode, response.body.msg || response.body, '\n');
            }
        }
        catch (error) {
            console.log('❌ Error en la petición:', error.message, '\n');
        }
    }
}
async function testRides() {
    console.log('🚕 RIDES Y ACEPTACIÓN\n');
    if (!testData.customerToken || !testData.captainToken) {
        console.log('⚠️  Saltando pruebas de rides - Tokens no disponibles\n');
        return;
    }
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
            console.log(`   Estado: ${testData.ride.status}`);
            console.log(`   Tarifa inicial: $${testData.ride.fare}\n`);
        }
        else {
            console.log('❌ Error:', response.statusCode, response.body.msg || response.body, '\n');
        }
    }
    catch (error) {
        console.log('❌ Error en la petición:', error.message, '\n');
    }
    if (testData.ride) {
        console.log('12. Aceptando ride (como captain)...');
        try {
            const response = await makeRequest({
                hostname: 'localhost',
                port: 3000,
                path: `/api/v1/rides/accept/${testData.ride._id}`,
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${testData.captainToken}`,
                },
            });
            if (response.statusCode === 200) {
                console.log('✅ Ride aceptado exitosamente');
                console.log(`   Estado: ${response.body.ride.status}`);
                console.log(`   Tarifa recalculada: $${response.body.ride.fare} (basada en precio del captain)\n`);
            }
            else {
                console.log('❌ Error:', response.statusCode, response.body.msg || response.body, '\n');
            }
        }
        catch (error) {
            console.log('❌ Error en la petición:', error.message, '\n');
        }
    }
    if (testData.ride) {
        console.log('12.5. Actualizando estado del ride a COMPLETED...');
        try {
            const response = await makeRequest({
                hostname: 'localhost',
                port: 3000,
                path: `/api/v1/rides/update/${testData.ride._id}`,
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${testData.captainToken}`,
                },
            }, {
                status: 'COMPLETED',
            });
            if (response.statusCode === 200) {
                console.log('✅ Ride completado exitosamente');
                console.log(`   Estado: ${response.body.ride.status}\n`);
            }
            else {
                console.log('❌ Error:', response.statusCode, response.body.msg || response.body, '\n');
            }
        }
        catch (error) {
            console.log('❌ Error en la petición:', error.message, '\n');
        }
    }
    if (testData.ride) {
        console.log('13. Calificando el ride...');
        try {
            const response = await makeRequest({
                hostname: 'localhost',
                port: 3000,
                path: `/api/v1/rides/${testData.ride._id}/rate`,
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${testData.customerToken}`,
                },
            }, {
                rating: 5,
                review: 'Excelente servicio, muy recomendado',
            });
            if (response.statusCode === 200) {
                console.log('✅ Ride calificado exitosamente');
                console.log(`   Calificación: ${response.body.ride.rating}`);
                console.log(`   Review: ${response.body.ride.review}\n`);
            }
            else {
                console.log('❌ Error:', response.statusCode, response.body.msg || response.body, '\n');
            }
        }
        catch (error) {
            console.log('❌ Error en la petición:', error.message, '\n');
        }
    }
    if (testData.captain) {
        console.log('14. Obteniendo calificaciones del captain...');
        try {
            const response = await makeRequest({
                hostname: 'localhost',
                port: 3000,
                path: `/api/v1/captains/${testData.captain._id}/ratings`,
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });
            if (response.statusCode === 200) {
                console.log('✅ Calificaciones del captain obtenidas');
                console.log(`   Promedio: ${response.body.captain.averageRating}`);
                console.log(`   Total calificaciones: ${response.body.captain.totalRatings}`);
                console.log(`   Lista de calificaciones: ${response.body.ratings.length}\n`);
            }
            else {
                console.log('❌ Error:', response.statusCode, '\n');
            }
        }
        catch (error) {
            console.log('❌ Error en la petición:', error.message, '\n');
        }
    }
}
async function runAllTests() {
    await signInUsers();
    await testStores();
    await testProducts();
    await testRides();
    console.log('📊 RESUMEN FINAL:');
    console.log(`   Customer Phone: ${authData.customerPhone}`);
    console.log(`   Captain Phone: ${authData.captainPhone}`);
    console.log(`   Seller Phone: ${authData.sellerPhone}`);
    console.log(`   Store ID: ${testData.store?._id || 'N/A'}`);
    console.log(`   Product ID: ${testData.product?._id || 'N/A'}`);
    console.log(`   Ride ID: ${testData.ride?._id || 'N/A'}`);
    console.log('\n✅ TODAS LAS PRUEBAS COMPLETADAS');
    console.log('\n📝 La base de datos ahora contiene:');
    console.log('   • 1 Customer con perfil completo');
    console.log('   • 1 Captain con DNI, precio por km personalizado');
    console.log('   • 1 Seller con business name y tax ID');
    console.log('   • 1 Store para el seller');
    console.log('   • 2 Productos (uno con nutrición, uno sin)');
    console.log('   • 1 Ride aceptado y calificado');
    console.log('   • Calificaciones del captain actualizadas');
}
runAllTests().catch(console.error);
//# sourceMappingURL=test-api-v1-completo.js.map