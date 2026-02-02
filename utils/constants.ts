export const PRODUCT_CATEGORIES: string[] = [
  "Comida y Bebidas",
  "Ropa y Accesorios",
  "Electrónica",
  "Hogar y Decoración",
  "Salud y Belleza",
  "Deportes",
  "Libros",
  "Juguetes",
  "Automotriz",
  "Otros"
];

export const VEHICLE_TYPES: string[] = ["bike", "auto", "car"];

export const USER_ROLES: string[] = ["customer", "captain", "store_owner"];

export interface PricePerKm {
  bike: number;
  auto: number;
  car: number;
}

export const DEFAULT_PRICES_PER_KM: PricePerKm = {
  bike: 150,
  auto: 150,
  car: 250
};

export const BASE_FARES: PricePerKm = {
  bike: 100,
  auto: 200,
  car: 200
};

export const MINIMUM_FARES: PricePerKm = {
  bike: 200,
  auto: 300,
  car: 400
};
