import { FastifyReply, FastifyRequest } from 'fastify';
import type { LoginResult } from './auth.service.js';
import authService from './auth.service.js';

async function login(request: FastifyRequest, reply: FastifyReply): Promise<LoginResult | { error: string }> {
  try {
    const result = await authService.loginWithTelegram(request.body as any);
    return result;
  } catch (err: any) {
    reply.code(401);
    return { error: err.message };
  }
}

async function register(request: FastifyRequest, reply: FastifyReply): Promise<LoginResult | { error: string }> {
  const { email, password } = (request.body || {}) as any;
  try {
    const result = await authService.registerWithEmail(email, password);
    return result;
  } catch (err: any) {
    reply.code(400);
    return { error: err.message };
  }
}

async function loginEmail(request: FastifyRequest, reply: FastifyReply): Promise<LoginResult | { error: string }> {
  const { email, password } = (request.body || {}) as any;
  try {
    const result = await authService.loginWithEmail(email, password);
    return result;
  } catch (err: any) {
    reply.code(400);
    return { error: err.message };
  }
}

async function getTelegramConfig(_request: FastifyRequest, reply: FastifyReply) {
  try {
    return await authService.getTelegramConfig();
  } catch (err: any) {
    reply.code(500);
    return { error: 'Failed to fetch Telegram config' };
  }
}

async function forgotPassword(request: FastifyRequest, reply: FastifyReply) {
  const { email } = (request.body || {}) as any;
  if (!email) {
    reply.code(400);
    return { error: 'E-posta adresi gereklidir' };
  }
  try {
    const result = await authService.forgotPassword(email);
    return result;
  } catch (err: any) {
    reply.code(500);
    return { error: err.message };
  }
}

async function resetPassword(request: FastifyRequest, reply: FastifyReply) {
  const { token, newPassword } = (request.body || {}) as any;
  if (!token || !newPassword) {
    reply.code(400);
    return { error: 'Token ve yeni şifre gereklidir' };
  }
  try {
    const result = await authService.resetPassword(token, newPassword);
    return result;
  } catch (err: any) {
    reply.code(400);
    return { error: err.message };
  }
}

export { forgotPassword, getTelegramConfig, login, loginEmail, register, resetPassword };
