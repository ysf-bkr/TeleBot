import { FastifyInstance } from 'fastify';
import { checkSetupStatus, configureSystem } from './setup.controller.js';

async function setupRouters(fastify: FastifyInstance): Promise<void> {
  fastify.get('/status', checkSetupStatus);
  fastify.post('/configure', configureSystem);
}

export default setupRouters;
