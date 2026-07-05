import { FastifyInstance } from 'fastify';
import { cleanupLogs, listLogs } from './log.controller.js';

async function logRouters(fastify: FastifyInstance): Promise<void> {
  fastify.get('/', listLogs);
  fastify.delete('/', cleanupLogs);
}

export default logRouters;
