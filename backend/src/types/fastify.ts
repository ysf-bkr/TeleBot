import 'fastify';
import { Server } from 'socket.io';

export interface JWTPayload {
  id: number | string;
  username: string;
  role?: string;
  workspace_id?: number;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: JWTPayload;
    workspace_id?: number;
    io?: Server;
  }

  interface FastifyInstance {
    io?: Server;
    generateToken?: (payload: JWTPayload) => string;
  }
}

export { };
