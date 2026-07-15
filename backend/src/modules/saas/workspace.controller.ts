import { FastifyReply, FastifyRequest } from 'fastify';
import planRepository from '../../repositories/plan.repository.js';
import subscriptionRepository from '../../repositories/subscription.repository.js';
import workspaceRepository from '../../repositories/workspace.repository.js';

// ===== PUBLIC: Plan listesi =====

export async function listPlans(request: FastifyRequest, reply: FastifyReply) {
  try {
    const plans = await planRepository.getAll();
    return plans;
  } catch (err: any) {
    reply.code(500);
    return { error: err.message };
  }
}

// ===== SUPER ADMIN: Workspace yönetimi =====

export async function listWorkspaces(request: FastifyRequest, reply: FastifyReply) {
  try {
    const workspaces = await workspaceRepository.getAll();
    return workspaces;
  } catch (err: any) {
    reply.code(500);
    return { error: err.message };
  }
}

export async function getWorkspace(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as any;
  try {
    const workspace = await workspaceRepository.findById(Number(id));
    if (!workspace) {
      reply.code(404);
      return { error: 'Workspace bulunamadı' };
    }
    return workspace;
  } catch (err: any) {
    reply.code(500);
    return { error: err.message };
  }
}

export async function createWorkspace(request: FastifyRequest, reply: FastifyReply) {
  const { name, slug, ownerId, planSlug } = request.body as any;

  if (!name || !slug) {
    reply.code(400);
    return { error: 'İsim ve slug gereklidir' };
  }

  try {
    // Check if slug is taken
    const existing = await workspaceRepository.findBySlug(slug);
    if (existing) {
      reply.code(409);
      return { error: 'Bu slug zaten kullanılıyor' };
    }

    // Get plan
    let planId: number | null = null;
    if (planSlug) {
      const plan = await planRepository.findBySlug(planSlug);
      if (plan) planId = plan.id;
    }

    const workspace = await workspaceRepository.create({
      name,
      slug,
      owner_id: ownerId ? Number(ownerId) : null,
      plan_id: planId,
      status: 'trial',
      bot_token: null,
      bot_username: null,
      settings: null,
    });

    return { success: true, workspace };
  } catch (err: any) {
    reply.code(500);
    return { error: err.message };
  }
}

export async function updateWorkspace(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as any;
  const updates = request.body as any;

  try {
    await workspaceRepository.update(Number(id), updates);
    return { success: true };
  } catch (err: any) {
    reply.code(500);
    return { error: err.message };
  }
}

export async function deleteWorkspace(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as any;
  try {
    await workspaceRepository.delete(Number(id));
    return { success: true };
  } catch (err: any) {
    reply.code(500);
    return { error: err.message };
  }
}

// ===== WORKSPACE SAHİBİ / ADMIN: Workspace detayları =====

export async function getMyWorkspace(request: FastifyRequest, reply: FastifyReply) {
  const workspaceId = request.workspace_id;
  if (!workspaceId) {
    reply.code(400);
    return { error: 'Workspace bulunamadı' };
  }

  try {
    const workspace = await workspaceRepository.findById(workspaceId);
    if (!workspace) {
      reply.code(404);
      return { error: 'Workspace bulunamadı' };
    }

    // Aktif aboneliği getir
    const subscription = await subscriptionRepository.findActiveByWorkspace(workspaceId);

    // Plan detayı
    let plan = null as any;
    if (workspace.plan_id) {
      plan = (await planRepository.findById(workspace.plan_id)) || null;
    } else if (subscription?.plan_slug) {
      plan = (await planRepository.findBySlug(subscription.plan_slug)) || null;
    }

    return {
      ...workspace,
      subscription,
      plan,
    };
  } catch (err: any) {
    reply.code(500);
    return { error: err.message };
  }
}

export async function updateMyWorkspace(request: FastifyRequest, reply: FastifyReply) {
  const workspaceId = request.workspace_id;
  if (!workspaceId) {
    reply.code(400);
    return { error: 'Workspace bulunamadı' };
  }

  const { name, botToken, botUsername, settings } = request.body as any;

  try {
    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (botToken !== undefined) updates.bot_token = botToken;
    if (botUsername !== undefined) updates.bot_username = botUsername;
    if (settings !== undefined) updates.settings = typeof settings === 'object' ? JSON.stringify(settings) : settings;

    await workspaceRepository.update(workspaceId, updates);
    return { success: true };
  } catch (err: any) {
    reply.code(500);
    return { error: err.message };
  }
}

// ===== DASHBOARD: İstatistik =====

export async function getDashboardStats(request: FastifyRequest, reply: FastifyReply) {
  const workspaceId = request.workspace_id;
  const db = (await import('../../db/index.js')).getDb();

  try {
    // Bot config sayısı
    const botCount = await db.selectFrom('bot_config')
      .select(db.fn.count<number>('id').as('count'))
      .where('workspace_id', '=', workspaceId!)
      .executeTakeFirst();

    // Chat sayısı
    const chatCount = await db.selectFrom('chats')
      .select(db.fn.count<number>('id').as('count'))
      .where('workspace_id', '=', workspaceId!)
      .executeTakeFirst();

    // Toplam log sayısı
    const logCount = await db.selectFrom('logs')
      .select(db.fn.count<number>('id').as('count'))
      .where('workspace_id', '=', workspaceId!)
      .executeTakeFirst();

    // Bugünkü aktivite
    const today = new Date().toISOString().split('T')[0];
    const todayActivity = await db.selectFrom('logs')
      .select(db.fn.count<number>('id').as('count'))
      .where('workspace_id', '=', workspaceId!)
      .where('timestamp', '>=', today)
      .executeTakeFirst();

    // Aktif kullanıcı sayısı (panel_users)
    const teamCount = await db.selectFrom('panel_users')
      .select(db.fn.count<number>('id').as('count'))
      .where('workspace_id', '=', workspaceId!)
      .executeTakeFirst();

    return {
      bots: Number(botCount?.count || 0),
      chats: Number(chatCount?.count || 0),
      logs: Number(logCount?.count || 0),
      todayActivity: Number(todayActivity?.count || 0),
      teamMembers: Number(teamCount?.count || 0),
    };
  } catch (err: any) {
    reply.code(500);
    return { error: err.message };
  }
}

// ===== SUPER ADMIN: Platform istatistikleri =====

export async function getAdminStats(request: FastifyRequest, reply: FastifyReply) {
  try {
    const totalWorkspaces = await workspaceRepository.countTotal();
    const totalPlans = (await planRepository.getAll()).length;
    const db = (await import('../../db/index.js')).getDb();

    const totalUsers = await db.selectFrom('panel_users')
      .select(db.fn.count<number>('id').as('count'))
      .executeTakeFirst();

    return {
      workspaces: totalWorkspaces,
      plans: totalPlans,
      users: Number(totalUsers?.count || 0),
    };
  } catch (err: any) {
    reply.code(500);
    return { error: err.message };
  }
}
