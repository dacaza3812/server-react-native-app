import { Request } from 'express';
import { Server as SocketIOServer, Socket } from 'socket.io';

export interface UserPayload {
  id: string;
  phone: string;
  role?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
      io?: SocketIOServer;
      socket?: Socket;
    }
  }
}
