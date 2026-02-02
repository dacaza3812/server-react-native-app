import { Socket } from "socket.io";
import jwt from "jsonwebtoken";
import UserV1 from "../../models/UserV1";

export const activeSockets = new Map();
export const rideNotificationSent: Record<string, boolean> = {};
export const rideToCaptains: Record<string, Set<string>> = {};
export const deliveryToCaptains: Record<string, Set<string>> = {};

export const socketAuthMiddleware = async (socket: Socket, next: (err?: Error) => void): Promise<void> => {
  const token = socket.handshake.headers.access_token as string;
  if (!token) {
    return next(new Error("Authentication invalid: No token provided"));
  }
  try {
    const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string) as {
      id: string;
    };
    const user = await UserV1.findById(payload.id);
    if (!user) {
      return next(new Error("Authentication invalid: User not found"));
    }
    (socket as any).user = {
      id: payload.id,
      role: user.role,
      firebasePushToken: user.firebasePushToken,
    };
    next();
  } catch (error) {
    return next(new Error("Authentication invalid: Token verification failed"));
  }
};

export async function getNearbyCaptainsFromRedis(lat: number, lng: number, radiusInMeters: number) {
  const { redis } = await import("../../utils/redisClient");
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
      };
    })
  );

  return captainsData.filter((c) => c !== null);
}

export async function updateNearbyCaptains(io: any) {
  io.sockets.sockets.forEach(async (sock: Socket) => {
    if ((sock as any).user?.role === "customer") {
      const custCoords = (sock as any).user.coords;
      if (custCoords) {
        try {
          const nearby = await getNearbyCaptainsFromRedis(
            custCoords.latitude,
            custCoords.longitude,
            60000
          );
          sock.emit("nearbyCaptains", nearby);
        } catch (error) {
          console.error("Error updating nearby captains:", error);
        }
      }
    }
  });
}
