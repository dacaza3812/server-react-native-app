import { redis } from "./redisClient";

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface CaptainData {
  id: string;
  coords: Coordinates;
  firebasePushToken: string;
  socketId: string;
  distance: number;
}

export interface StoreData {
  id: string;
  name: string;
  address: string;
  distance: number;
  categories: string[];
  deliveryFee: number;
  minimumOrderAmount: number;
  averageDeliveryTime: number;
  rating: number;
}

export interface RateStructure {
  baseFare: number;
  perKmRate: number;
  minimumFare: number;
}

export interface FareStructure {
  bike: RateStructure;
  auto: RateStructure;
  cabEconomy: RateStructure;
  cabPremium: RateStructure;
}

export const calculateDeliveryFee = (
  distance: number,
  baseFee: number = 0,
  weight: number = 0,
  urgency: "normal" | "express" = "normal"
): number => {
  const baseRate = baseFee;
  const distanceRate = distance * 10; // $10 per km
  const weightRate = weight * 5; // $5 per kg
  const urgencyMultiplier = urgency === "express" ? 1.5 : 1;

  const calculatedFee = baseRate + distanceRate + weightRate;
  return Math.floor((calculatedFee * urgencyMultiplier) / 10) * 10; // Round to nearest 10
};

export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const calculateFare = (distance: number): Record<string, number> => {
  const rateStructure: FareStructure = {
    bike: { baseFare: 100, perKmRate: 150, minimumFare: 200 },
    auto: { baseFare: 200, perKmRate: 150, minimumFare: 300 },
    cabEconomy: { baseFare: 200, perKmRate: 250, minimumFare: 400 },
    cabPremium: { baseFare: 200, perKmRate: 300, minimumFare: 500 },
  };

  const fareCalculation = (baseFare: number, perKmRate: number, minimumFare: number): number => {
    const calculatedFare = baseFare + distance * perKmRate;
    const maxFare = Math.max(calculatedFare, minimumFare);
    return Math.floor(maxFare / 10) * 10; // Redondeo hacia abajo al múltiplo de 10
  };

  return {
    bike: fareCalculation(
      rateStructure.bike.baseFare,
      rateStructure.bike.perKmRate,
      rateStructure.bike.minimumFare
    ),
    auto: fareCalculation(
      rateStructure.auto.baseFare,
      rateStructure.auto.perKmRate,
      rateStructure.auto.minimumFare
    ),
    cabEconomy: fareCalculation(
      rateStructure.cabEconomy.baseFare,
      rateStructure.cabEconomy.perKmRate,
      rateStructure.cabEconomy.minimumFare
    ),
    cabPremium: fareCalculation(
      rateStructure.cabPremium.baseFare,
      rateStructure.cabPremium.perKmRate,
      rateStructure.cabPremium.minimumFare
    ),
  };
};

export const generateOTP = (): string => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

export async function getNearbyCaptainsFromRedis(
  lat: number,
  lng: number,
  radiusInMeters: number
): Promise<CaptainData[]> {
  const result = await redis.georadius(
    "drivers:locations",
    lng,
    lat,
    radiusInMeters,
    "m",
    "WITHDIST",
    "ASC"
  );

  if (!result.length) return [];

  const captainsData = await Promise.all(
    result.map(async ([captainId, distance]: [string, string]) => {
      const meta = await redis.hgetall(`drivers:meta:${captainId}`);
      if (!meta || !meta.socketId) return null;

      return {
        id: captainId,
        coords: {
          latitude: parseFloat(meta.lat),
          longitude: parseFloat(meta.lng),
        },
        firebasePushToken: meta.firebasePushToken || "",
        socketId: meta.socketId,
        distance: parseFloat(distance),
      } as CaptainData;
    })
  );

  return captainsData.filter((c): c is CaptainData => c !== null);
}

export async function getNearbyStoresFromRedis(
  lat: number,
  lng: number,
  radiusInMeters: number
): Promise<StoreData[]> {
  const result = await redis.georadius(
    "stores:locations",
    lng,
    lat,
    radiusInMeters,
    "m",
    "WITHDIST",
    "ASC"
  );

  if (!result.length) return [];

  const storesData = await Promise.all(
    result.map(async ([storeId, distance]: [string, string]) => {
      const meta = await redis.hgetall(`stores:meta:${storeId}`);
      if (!meta || !meta.name) return null;

      return {
        id: storeId,
        name: meta.name,
        address: meta.address,
        distance: parseFloat(distance),
        categories: meta.categories ? JSON.parse(meta.categories) : [],
        deliveryFee: parseFloat(meta.deliveryFee) || 0,
        minimumOrderAmount: parseFloat(meta.minimumOrderAmount) || 0,
        averageDeliveryTime: parseInt(meta.averageDeliveryTime) || 30,
        rating: parseFloat(meta.rating) || 0,
      } as StoreData;
    })
  );

  return storesData.filter((s): s is StoreData => s !== null);
}

export async function getAvailableDeliveriesFromRedis(
  lat: number,
  lng: number,
  radiusInMeters: number
): Promise<CaptainData[]> {
  const captains = await getNearbyCaptainsFromRedis(lat, lng, radiusInMeters);

  if (!captains.length) return [];

  const activeDeliveries = await redis.zrange("deliveries:active", 0, -1);

  const availableCaptains = await Promise.all(
    captains.map(async (captain) => {
      const hasDelivery = await Promise.all(
        activeDeliveries.map((deliveryId) =>
          redis.hexists(`captain:delivery:${captain.id}`, deliveryId)
        )
      );
      return hasDelivery.some((exists) => exists) ? null : captain;
    })
  );

  return availableCaptains.filter((c): c is CaptainData => c !== null);
}

export async function assignDeliveryToRedis(
  captainId: string,
  deliveryId: string
): Promise<void> {
  await redis.hset(`captain:delivery:${captainId}`, deliveryId, Date.now().toString());
  await redis.zadd("deliveries:active", Date.now(), deliveryId);
}

export async function releaseDeliveryFromRedis(
  captainId: string,
  deliveryId: string
): Promise<void> {
  await redis.hdel(`captain:delivery:${captainId}`, deliveryId);

  const otherCaptains = await redis.hgetall(`delivery:captains:${deliveryId}`);
  if (!otherCaptains || Object.keys(otherCaptains).length === 0) {
    await redis.zrem("deliveries:active", deliveryId);
  }
}

export async function updateCaptainLocationInRedis(
  captainId: string,
  lat: number,
  lng: number
): Promise<void> {
  await redis.geoadd("drivers:locations", lng, lat, captainId);
  await redis.hset(`drivers:meta:${captainId}`, "lat", lat.toString(), "lng", lng.toString());
}

export async function updateStoreLocationInRedis(
  storeId: string,
  lat: number,
  lng: number
): Promise<void> {
  await redis.geoadd("stores:locations", lng, lat, storeId);
  await redis.hset(`stores:meta:${storeId}`, "lat", lat.toString(), "lng", lng.toString());
}
