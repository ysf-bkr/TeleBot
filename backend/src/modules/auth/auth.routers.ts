import { FastifyInstance } from 'fastify';
import { forgotPassword, getTelegramConfig, login, loginEmail, register, resetPassword } from './auth.controller.js';

async function authRouters(fastify: FastifyInstance): Promise<void> {
  fastify.post('/login', login);
  fastify.post('/register', register);
  fastify.post('/login-email', loginEmail);
  fastify.get('/config', getTelegramConfig);
  fastify.post('/forgot-password', forgotPassword);
  fastify.post('/reset-password', resetPassword);
}

export default authRouters;
