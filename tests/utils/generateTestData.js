const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const randStr = (length = 8) => crypto.randomBytes(Math.ceil(length/2)).toString('hex').slice(0,length);
const randInt = (min = 0, max = 100) => Math.floor(Math.random()*(max-min+1))+min;
const randFloat = (min = 0, max = 1, dec = 2) => parseFloat((Math.random()*(max-min)+min).toFixed(dec));

const generateUser = (role = 'customer') => {
  return {
    role,
    phone: `${randInt(3000000000,9999999999)}`.slice(0,10),
    firebasePushToken: randStr(20),
    profile: {
      name: `Test User ${randStr(4)}`,
      email: `test_${randStr(4)}@example.com`,
      avatar: '',
      dateOfBirth: new Date(1990,0,1),
      gender: ['male','female','other'][randInt(0,2)],
    },
    isVerified: true,
    addresses: [
      {
        street: 'Test Street 1',
        city: 'Test City',
        state: 'Test State',
        country: 'MX',
        postalCode: '00000',
        latitude: randFloat(-90,90,6),
        longitude: randFloat(-180,180,6),
        isDefault: true,
        label: 'Home',
      },
    ],
    deliveryPreferences: {
      defaultAddress: {
        street: 'Test Street 1',
        city: 'Test City',
        state: 'Test State',
        country: 'MX',
        postalCode: '00000',
        latitude: randFloat(-90,90,6),
        longitude: randFloat(-180,180,6),
      },
      preferredContact: 'phone',
      instructions: '',
      tipPercentage: randInt(0,20),
    },
    vehicle: role === 'captain' ? {
      type: ['bike','auto','car'][randInt(0,2)],
      licensePlate: randStr(6).toUpperCase(),
      color: 'blue',
      model: '2020',
    } : undefined,
  };
};

const generateAccessToken = (userId, phone) => {
  return jwt.sign({ id: userId, phone: phone }, process.env.ACCESS_TOKEN_SECRET || 'test_secret', { expiresIn: '1h' });
};

const generateStore = (ownerId) => {
  return {
    name: `Test Store ${randStr(4)}`,
    description: 'A test store',
    address: {
      street: 'Store Street 1',
      city: 'Test City',
      state: 'State',
      country: 'MX',
      postalCode: '00000',
      latitude: randFloat(-90,90,6),
      longitude: randFloat(-180,180,6),
    },
    contact: {
      phone: `${randInt(3000000000,9999999999)}`.slice(0,10),
      email: `store_${randStr(4)}@example.com`,
      website: '',
    },
    businessHours: {},
    categories: ['General'],
    logo: '',
    banner: '',
    isActive: true,
    deliveryRadius: 10000,
    averageDeliveryTime: 30,
    minimumOrderAmount: 0,
    deliveryFee: 20,
    taxRate: 0.16,
    paymentMethods: ['cash','card'],
    owner: ownerId,
  };
};

const generateProduct = (storeId) => {
  return {
    name: `Product ${randStr(4)}`,
    description: 'A test product',
    price: randFloat(10,1000,2),
    currency: 'MXN',
    category: 'General',
    store: storeId,
    images: ['https://example.com/image1.jpg'],
    thumbnail: 'https://example.com/thumbnail.jpg',
    weight: randFloat(0.1,10,2),
    dimensions: { length: randInt(5,50), width: randInt(5,50), height: randInt(5,50) },
    inventory: randInt(1,100),
    lowInventoryThreshold: randInt(1,10),
    isAvailable: true,
    isActive: true,
    tags: [],
    discount: 0,
    discountValidUntil: null,
  };
};

const generateDelivery = (customerId, storeId, captainId = null, items = [], productId = null) => {
  const pickupLat = randFloat(-90,90,6);
  const pickupLon = randFloat(-180,180,6);
  const deliveryLat = randFloat(-90,90,6);
  const deliveryLon = randFloat(-180,180,6);

  let subtotal = 0;
  const defaultProductId = productId || new require('mongoose').Types.ObjectId();
  const generatedItems = items.length ? items : [ { 
    product: defaultProductId, 
    name: 'Item', 
    price: 100, 
    quantity: 1, 
    subtotal: 100 
  } ];
  generatedItems.forEach(i => subtotal += i.subtotal || (i.price*i.quantity));

  const deliveryFee = 20;
  const tax = parseFloat((subtotal * 0.16).toFixed(2));
  const total = parseFloat((subtotal + deliveryFee + tax).toFixed(2));

  return {
    deliveryType: 'HOME_DELIVERY',
    orderNumber: `ORD${randStr(6).toUpperCase()}`,
    store: storeId,
    customer: customerId,
    captain: captainId,
    items: generatedItems,
    pickup: { 
      address: { 
        street: 'Pickup Street 123', 
        city: 'Test City', 
        state: 'Test State', 
        country: 'MX', 
        postalCode: '00000' 
      }, 
      latitude: pickupLat, 
      longitude: pickupLon 
    },
    delivery: { 
      address: { 
        street: 'Delivery Street 456', 
        city: 'Test City', 
        state: 'Test State', 
        country: 'MX', 
        postalCode: '00000' 
      }, 
      latitude: deliveryLat, 
      longitude: deliveryLon 
    },
    pricing: { subtotal, tax, deliveryFee, total, currency: 'MXN' },
    status: 'PENDING',
    paymentStatus: 'PENDING',
    paymentMethod: 'cash',
    trackingCode: `TRK${randStr(8).toUpperCase()}`,
    otp: `${randInt(1000,9999)}`,
  };
};

const generateRide = (customerId, captainId = null) => {
  const pickupLat = randFloat(-90,90,6);
  const pickupLon = randFloat(-180,180,6);
  const dropLat = randFloat(-90,90,6);
  const dropLon = randFloat(-180,180,6);

  return {
    vehicle: ['bike','auto','cabEconomy','cabPremium'][randInt(0,3)],
    distance: randFloat(1,50,2),
    pickup: { address: 'Pickup', latitude: pickupLat, longitude: pickupLon },
    drop: { address: 'Drop', latitude: dropLat, longitude: dropLon },
    fare: randInt(50,500),
    customer: customerId,
    captain: captainId,
    status: 'SEARCHING_FOR_CAPTAIN',
    otp: `${randInt(1000,9999)}`,
  };
};

module.exports = { generateUser, generateAccessToken, generateStore, generateProduct, generateDelivery, generateRide };
