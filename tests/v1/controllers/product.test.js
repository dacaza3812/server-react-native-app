const request = require('supertest');
const app = require('../../../app');
const UserV1 = require('../../../models/UserV1');
const Store = require('../../../models/Store');
const ProductV1 = require('../../../models/ProductV1');

describe('Products V1 Controller Tests', () => {
  describe('GET /api/v1/products/categories', () => {
    it('should get product categories successfully', async () => {
      const response = await request(app)
        .get('/api/v1/products/categories')
        .expect(200);

      expect(response.body.message).toBe('Product categories retrieved successfully');
      expect(response.body.categories).toBeDefined();
      expect(Array.isArray(response.body.categories)).toBe(true);
      expect(response.body.categories.length).toBeGreaterThan(0);
      expect(response.body.categories).toContain('Comida y Bebidas');
      expect(response.body.categories).toContain('Electrónica');
      expect(response.body.categories).toContain('Otros');
    });
  });

  describe('POST /api/v1/products/store/:storeId', () => {
    let seller, store, token;

    beforeEach(async () => {
      const sellerData = {
        phone: '1234567890',
        role: 'store_owner',
        profile: {
          name: 'Juan',
          lastName: 'Pérez',
        },
      };

      seller = new UserV1(sellerData);
      await seller.save();

      const storeData = {
        name: 'Tienda de Juan',
        address: {
          street: 'Calle Principal 123',
          city: 'Ciudad de México',
          state: 'CDMX',
          country: 'MX',
          postalCode: '06600',
          latitude: 19.4326,
          longitude: -99.1332,
        },
        contact: {
          phone: '5551234567',
          email: 'store@juan.com',
        },
        categories: ['Comida y Bebidas'],
        owner: seller._id,
      };

      store = new Store(storeData);
      await store.save();

      token = seller.createAccessToken();
    });

    it('should create a product successfully', async () => {
      const productData = {
        name: 'Hamburguesa Especial',
        description: 'Deliciosa hamburguesa con queso y tocino',
        price: 150,
        category: 'Comida y Bebidas',
        images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
        thumbnail: 'https://example.com/thumb.jpg',
        weight: 0.5,
        dimensions: {
          length: 15,
          width: 10,
          height: 5,
        },
        inventory: 50,
        lowInventoryThreshold: 10,
        tags: ['hamburguesa', 'comida rápida'],
        nutritionFacts: {
          calories: 500,
          protein: 25,
          carbs: 30,
          fat: 20,
        },
      };

      const response = await request(app)
        .post(`/api/v1/products/store/${store._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(productData)
        .expect(201);

      expect(response.body.message).toBe('Product created successfully');
      expect(response.body.product.name).toBe('Hamburguesa Especial');
      expect(response.body.product.category).toBe('Comida y Bebidas');
      expect(response.body.product.price).toBe(150);
      expect(response.body.product.inventory).toBe(50);
      expect(response.body.product.nutritionFacts.calories).toBe(500);
    });

    it('should create a product without nutrition facts', async () => {
      const productData = {
        name: 'Camiseta',
        description: 'Camiseta de algodón',
        price: 250,
        category: 'Ropa y Accesorios',
        images: ['https://example.com/shirt.jpg'],
        thumbnail: 'https://example.com/shirt-thumb.jpg',
        inventory: 20,
      };

      const response = await request(app)
        .post(`/api/v1/products/store/${store._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(productData)
        .expect(201);

      expect(response.body.message).toBe('Product created successfully');
      expect(response.body.product.category).toBe('Ropa y Accesorios');
      expect(response.body.product.nutritionFacts).toBeUndefined();
    });

    it('should fail with invalid category', async () => {
      const productData = {
        name: 'Producto inválido',
        description: 'Descripción',
        price: 100,
        category: 'Categoría inválida',
        images: ['https://example.com/image.jpg'],
        thumbnail: 'https://example.com/thumb.jpg',
        inventory: 10,
      };

      const response = await request(app)
        .post(`/api/v1/products/store/${store._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(productData)
        .expect(400);

      expect(response.body.msg).toContain('Invalid category');
    });

    it('should fail for non-store owner', async () => {
      const anotherSellerData = {
        phone: '9876543210',
        role: 'store_owner',
      };

      const anotherSeller = new UserV1(anotherSellerData);
      await anotherSeller.save();

      const anotherToken = anotherSeller.createAccessToken();

      const productData = {
        name: 'Producto no autorizado',
        description: 'Descripción',
        price: 100,
        category: 'Comida y Bebidas',
        images: ['https://example.com/image.jpg'],
        thumbnail: 'https://example.com/thumb.jpg',
        inventory: 10,
      };

      const response = await request(app)
        .post(`/api/v1/products/store/${store._id}`)
        .set('Authorization', `Bearer ${anotherToken}`)
        .send(productData)
        .expect(400);

      expect(response.body.msg).toBe("You don't own this store");
    });
  });

  describe('GET /api/v1/products/store/:storeId', () => {
    let store, products;

    beforeEach(async () => {
      const sellerData = {
        phone: '5555555555',
        role: 'store_owner',
      };

      const seller = new UserV1(sellerData);
      await seller.save();

      const storeData = {
        name: 'Tienda de Test',
        address: {
          street: 'Calle Test 123',
          city: 'Test City',
          state: 'TS',
          country: 'MX',
          postalCode: '00000',
          latitude: 19.4326,
          longitude: -99.1332,
        },
        contact: {
          phone: '5551111111',
          email: 'test@test.com',
        },
        categories: ['Comida y Bebidas', 'Electrónica'],
        owner: seller._id,
      };

      store = new Store(storeData);
      await store.save();

      const product1 = new ProductV1({
        name: 'Producto 1',
        description: 'Descripción 1',
        price: 100,
        category: 'Comida y Bebidas',
        store: store._id,
        images: ['https://example.com/p1.jpg'],
        thumbnail: 'https://example.com/p1-thumb.jpg',
        inventory: 20,
      });
      await product1.save();

      const product2 = new ProductV1({
        name: 'Producto 2',
        description: 'Descripción 2',
        price: 200,
        category: 'Electrónica',
        store: store._id,
        images: ['https://example.com/p2.jpg'],
        thumbnail: 'https://example.com/p2-thumb.jpg',
        inventory: 15,
      });
      await product2.save();

      products = [product1, product2];
    });

    it('should get store products successfully', async () => {
      const response = await request(app)
        .get(`/api/v1/products/store/${store._id}`)
        .expect(200);

      expect(response.body.message).toBe('Store products retrieved successfully');
      expect(response.body.count).toBe(2);
      expect(response.body.products).toBeDefined();
      expect(response.body.products[0].name).toBe('Producto 1');
      expect(response.body.products[1].name).toBe('Producto 2');
    });

    it('should filter products by category', async () => {
      const response = await request(app)
        .get(`/api/v1/products/store/${store._id}?category=Comida y Bebidas`)
        .expect(200);

      expect(response.body.count).toBe(1);
      expect(response.body.products[0].category).toBe('Comida y Bebidas');
    });
  });

  describe('GET /api/v1/products/:productId', () => {
    it('should get product by id successfully', async () => {
      const sellerData = {
        phone: '1111111111',
        role: 'store_owner',
      };

      const seller = new UserV1(sellerData);
      await seller.save();

      const storeData = {
        name: 'Tienda de Test 2',
        address: {
          street: 'Calle Test 456',
          city: 'Test City',
          state: 'TS',
          country: 'MX',
          postalCode: '00001',
          latitude: 19.4326,
          longitude: -99.1332,
        },
        contact: {
          phone: '5552222222',
          email: 'test2@test.com',
        },
        categories: ['Electrónica'],
        owner: seller._id,
        isActive: true,
      };

      const store = new Store(storeData);
      await store.save();

      const product = new ProductV1({
        name: 'Smartphone',
        description: 'Último modelo',
        price: 15000,
        category: 'Electrónica',
        store: store._id,
        images: ['https://example.com/phone.jpg'],
        thumbnail: 'https://example.com/phone-thumb.jpg',
        inventory: 10,
      });
      await product.save();

      const response = await request(app)
        .get(`/api/v1/products/${product._id}`)
        .expect(200);

      expect(response.body.message).toBe('Product retrieved successfully');
      expect(response.body.product.name).toBe('Smartphone');
      expect(response.body.product.category).toBe('Electrónica');
    });
  });

  describe('PATCH /api/v1/products/:productId', () => {
    let seller, store, product, token;

    beforeEach(async () => {
      const sellerData = {
        phone: '2222222222',
        role: 'store_owner',
      };

      seller = new UserV1(sellerData);
      await seller.save();

      const storeData = {
        name: 'Tienda de Test 3',
        address: {
          street: 'Calle Test 789',
          city: 'Test City',
          state: 'TS',
          country: 'MX',
          postalCode: '00002',
          latitude: 19.4326,
          longitude: -99.1332,
        },
        contact: {
          phone: '5553333333',
          email: 'test3@test.com',
        },
        categories: ['Hogar y Decoración'],
        owner: seller._id,
      };

      store = new Store(storeData);
      await store.save();

      product = new ProductV1({
        name: 'Lámpara',
        description: 'Lámpara de mesa',
        price: 500,
        category: 'Hogar y Decoración',
        store: store._id,
        images: ['https://example.com/lamp.jpg'],
        thumbnail: 'https://example.com/lamp-thumb.jpg',
        inventory: 10,
      });
      await product.save();

      token = seller.createAccessToken();
    });

    it('should update product successfully', async () => {
      const response = await request(app)
        .patch(`/api/v1/products/${product._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Lámpara LED',
          description: 'Lámpara de mesa LED',
          price: 600,
        })
        .expect(200);

      expect(response.body.message).toBe('Product updated successfully');
      expect(response.body.product.name).toBe('Lámpara LED');
      expect(response.body.product.description).toBe('Lámpara de mesa LED');
      expect(response.body.product.price).toBe(600);
    });

    it('should fail to update product with invalid category', async () => {
      const response = await request(app)
        .patch(`/api/v1/products/${product._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          category: 'Categoría inválida',
        })
        .expect(400);

      expect(response.body.msg).toContain('Invalid category');
    });
  });
});
