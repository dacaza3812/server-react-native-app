const PRODUCT_CATEGORIES = [
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
const VEHICLE_TYPES = ["bike", "auto", "car"];
const USER_ROLES = ["customer", "captain", "store_owner"];
const DEFAULT_PRICES_PER_KM = {
    bike: 150,
    auto: 150,
    car: 250
};
const BASE_FARES = {
    bike: 100,
    auto: 200,
    car: 200
};
const MINIMUM_FARES = {
    bike: 200,
    auto: 300,
    car: 400
};
module.exports = {
    PRODUCT_CATEGORIES,
    VEHICLE_TYPES,
    USER_ROLES,
    DEFAULT_PRICES_PER_KM,
    BASE_FARES,
    MINIMUM_FARES
};
//# sourceMappingURL=constants.js.map