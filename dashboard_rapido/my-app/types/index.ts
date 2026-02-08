export interface User {
  _id: string;
  role: 'customer' | 'captain' | 'store_owner';
  phone: string;
  email?: string;
  isActive: boolean;
  profile?: {
    name?: string;
    lastName?: string;
    email?: string;
    avatarUrl?: string;
  };
  vehicle?: {
    type: string;
    licensePlate?: string;
    color?: string;
    model?: string;
  };
  createdAt: string;
}

export interface Ride {
  _id: string;
  vehicle: string;
  distance: number;
  pickup: {
    address: string;
    latitude: number;
    longitude: number;
  };
  drop: {
    address: string;
    latitude: number;
    longitude: number;
  };
  fare: number;
  customer: User;
  captain?: User;
  status: 'SEARCHING_FOR_CAPTAIN' | 'START' | 'ARRIVED' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
}

export interface Delivery {
  _id: string;
  orderNumber: string;
  deliveryType: string;
  store: Store;
  customer: User;
  captain?: User;
  items: DeliveryItem[];
  pickup: {
    address: {
      street: string;
      city: string;
    };
    latitude: number;
    longitude: number;
  };
  delivery: {
    address: {
      street: string;
      city: string;
    };
    latitude: number;
    longitude: number;
  };
  pricing: {
    subtotal: number;
    deliveryFee: number;
    total: number;
  };
  status: 'PENDING' | 'ASSIGNED' | 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
  createdAt: string;
}

export interface DeliveryItem {
  product: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface Store {
  _id: string;
  name: string;
  description?: string;
  address: {
    street: string;
    city: string;
    latitude: number;
    longitude: number;
  };
  contact: {
    phone: string;
    email: string;
  };
  categories: string[];
  isActive: boolean;
  owner: User;
  ratings?: {
    average: number;
    total: number;
  };
}

export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  store: Store;
  images: string[];
  thumbnail?: string;
  inventory: number;
  isAvailable: boolean;
  isActive: boolean;
}

export interface CaptainLocation {
  id: string;
  coords: {
    latitude: number;
    longitude: number;
  };
  socketId: string;
  profile?: {
    name?: string;
    lastName?: string;
  };
  phone?: string;
  vehicle?: {
    type: string;
    licensePlate?: string;
  };
}

export interface DashboardStats {
  users: {
    total: number;
    captains: number;
    customers: number;
    storeOwners: number;
    activeCaptains: number;
  };
  rides: {
    total: number;
    today: number;
    byStatus: Record<string, number>;
  };
  deliveries: {
    total: number;
    today: number;
    byStatus: Record<string, number>;
  };
  stores: {
    total: number;
    active: number;
  };
  products: {
    total: number;
  };
}
