import { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import jwt from 'jsonwebtoken';
import { JWT_SECRET as MIDDLEWARE_SECRET } from '../middleware/auth.js';
import { JWTPayload } from '../types/fastify.js';

const JWT_SECRET: string = MIDDLEWARE_SECRET || process.env.JWT_SECRET || 'dev_fallback_change_in_production';

const authPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorateRequest('user', undefined);

  fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    // Skip auth for public routes
    const publicPaths = ['/api/auth', '/api/health', '/p/', '/webhooks'];
    if (publicPaths.some(p => request.url.startsWith(p))) {
      return;
    }

    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.code(401).send({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
      request.user = decoded;
    } catch (err) {
      return reply.code(401).send({ error: 'Unauthorized: Invalid token' });
    }
  });

  // Helper to generate token
  fastify.decorate('generateToken', (payload: JWTPayload) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
  });
};

export default fp(authPlugin, {
  name: 'auth-plugin',
});

export { JWT_SECRET, type JWTPayload };
