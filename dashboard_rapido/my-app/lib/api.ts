const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3050/api';

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options?.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.msg || data.message || 'Error en la solicitud');
  }

  return data;
}

// Auth
export const login = async (email: string, password: string) => {
  const response = await fetchApi<{ message: string; token: string; user: any }>(
    '/admin/auth/login',
    {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }
  );
  return response;
};

// Stats
export const getStats = () => fetchApi('/admin/stats');

// Live Captains
export const getLiveCaptains = () => fetchApi('/admin/captains/live');

// Users
export const getUsers = (params?: Record<string, string>) => {
  const query = params ? '?' + new URLSearchParams(params).toString() : '';
  return fetchApi(`/admin/users${query}`);
};

export const getUserById = (id: string) => fetchApi(`/admin/users/${id}`);

export const createUser = (data: Record<string, unknown>) =>
  fetchApi('/admin/users', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const updateUser = (id: string, data: Record<string, unknown>) =>
  fetchApi(`/admin/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

export const deleteUser = (id: string) =>
  fetchApi(`/admin/users/${id}`, { method: 'DELETE' });

// Rides
export const getRides = (params?: Record<string, string>) => {
  const query = params ? '?' + new URLSearchParams(params).toString() : '';
  return fetchApi(`/admin/rides${query}`);
};

export const getRideById = (id: string) => fetchApi(`/admin/rides/${id}`);

export const createRide = (data: Record<string, unknown>) =>
  fetchApi('/admin/rides', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const updateRide = (id: string, data: Record<string, unknown>) =>
  fetchApi(`/admin/rides/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

export const deleteRide = (id: string) =>
  fetchApi(`/admin/rides/${id}`, { method: 'DELETE' });

// Deliveries
export const getDeliveries = (params?: Record<string, string>) => {
  const query = params ? '?' + new URLSearchParams(params).toString() : '';
  return fetchApi(`/admin/deliveries${query}`);
};

export const getDeliveryById = (id: string) => fetchApi(`/admin/deliveries/${id}`);

export const createDelivery = (data: Record<string, unknown>) =>
  fetchApi('/admin/deliveries', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const updateDelivery = (id: string, data: Record<string, unknown>) =>
  fetchApi(`/admin/deliveries/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

export const deleteDelivery = (id: string) =>
  fetchApi(`/admin/deliveries/${id}`, { method: 'DELETE' });

// Stores
export const getStores = (params?: Record<string, string>) => {
  const query = params ? '?' + new URLSearchParams(params).toString() : '';
  return fetchApi(`/admin/stores${query}`);
};

export const getStoreById = (id: string) => fetchApi(`/admin/stores/${id}`);

export const createStore = (data: Record<string, unknown>) =>
  fetchApi('/admin/stores', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const updateStore = (id: string, data: Record<string, unknown>) =>
  fetchApi(`/admin/stores/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

export const deleteStore = (id: string) =>
  fetchApi(`/admin/stores/${id}`, { method: 'DELETE' });

// Products
export const getProducts = (params?: Record<string, string>) => {
  const query = params ? '?' + new URLSearchParams(params).toString() : '';
  return fetchApi(`/admin/products${query}`);
};

export const getProductById = (id: string) => fetchApi(`/admin/products/${id}`);

export const createProduct = (data: Record<string, unknown>) =>
  fetchApi('/admin/products', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const updateProduct = (id: string, data: Record<string, unknown>) =>
  fetchApi(`/admin/products/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

export const deleteProduct = (id: string) =>
  fetchApi(`/admin/products/${id}`, { method: 'DELETE' });
