import { FastifyInstance } from 'fastify';
import {
  createWorkspace,
  deleteWorkspace,
  getAdminStats,
  getDashboardStats,
  getMyWorkspace,
  getWorkspace,
  listPlans,
  listWorkspaces,
  updateMyWorkspace,
  updateWorkspace,
  upgradePlan,
} from './workspace.controller.js';

async function workspaceRouters(fastify: FastifyInstance): Promise<void> {
  // ===== PUBLIC ROUTES =====
  // Plan listesi (herkese açık)
  fastify.get('/plans', listPlans);

  // ===== SUPER ADMIN ROUTES =====
  // Workspace CRUD (sadece super_admin)
  fastify.get('/admin/workspaces', listWorkspaces);
  fastify.get('/admin/workspaces/:id', getWorkspace);
  fastify.post('/admin/workspaces', createWorkspace);
  fastify.patch('/admin/workspaces/:id', updateWorkspace);
  fastify.delete('/admin/workspaces/:id', deleteWorkspace);
  fastify.get('/admin/stats', getAdminStats);

  // ===== WORKSPACE OWNER ROUTES =====
  // Mevcut workspace detayları
  fastify.get('/workspace', getMyWorkspace);
  fastify.patch('/workspace', updateMyWorkspace);

  // Plan yükseltme/düşürme
  fastify.post('/workspace/upgrade', upgradePlan);

  // Dashboard istatistikleri
  fastify.get('/workspace/stats', getDashboardStats);
}

export default workspaceRouters;
