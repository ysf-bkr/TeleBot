import 'fastify';
import { Server } from 'socket.io';

export interface JWTPayload {
  id: number | string;
  username: string;
  role?: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: JWTPayload;
    io?: Server;
  }

  interface FastifyInstance {
    io?: Server;
    generateToken?: (payload: JWTPayload) => string;
  }
}

export {};
