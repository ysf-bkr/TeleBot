import { FastifyReply, FastifyRequest } from 'fastify';
import { getDb } from '../db/index.js';
import planRepository from '../repositories/plan.repository.js';
import workspaceRepository from '../repositories/workspace.repository.js';
import type { SubscriptionPlan } from '../types/db.js';

/**
 * Bu middleware bir workspace'in plan limitlerini kontrol eder.
 * Kullanım: Belirli route'larda planLimits ile dekore edilir.
 */
export async function checkPlanLimit(
  request: FastifyRequest,
  reply: FastifyReply,
  resourceType: 'bots' | 'chats' | 'team_members'
) {
  const workspaceId = request.workspace_id;
  if (!workspaceId) return true; // super admin, bypass

  try {
    const workspace = await workspaceRepository.findById(workspaceId);
    if (!workspace) return true;

    // Plan limitlerini al
    let plan: SubscriptionPlan | null = null;
    if (workspace.plan_id) {
      plan = (await planRepository.findById(workspace.plan_id)) || null;
    }

    if (!plan) {
      // Varsayılan free plan
      plan = (await planRepository.getDefaultPlan()) || null;
    }

    if (!plan) return true;

    const db = getDb();

    switch (resourceType) {
      case 'bots': {
        const count = await db.selectFrom('bot_config')
          .select(db.fn.count<number>('id').as('count'))
          .where('workspace_id', '=', workspaceId)
          .executeTakeFirst();

        if (Number(count?.count || 0) >= plan.max_bots) {
          reply.code(403);
          reply.send({
            error: 'Plan Limit Aşıldı',
            message: `Planınız en fazla ${plan.max_bots} bot desteklemektedir. Daha fazla bot eklemek için planınızı yükseltin.`,
            limit: plan.max_bots,
            current: Number(count?.count || 0),
          });
          return false;
        }
        return true;
      }
      case 'chats': {
        const count = await db.selectFrom('chats')
          .select(db.fn.count<number>('id').as('count'))
          .where('workspace_id', '=', workspaceId)
          .executeTakeFirst();

        if (Number(count?.count || 0) >= plan.max_chats_per_bot) {
          reply.code(403);
          reply.send({
            error: 'Plan Limit Aşıldı',
            message: `Planınız en fazla ${plan.max_chats_per_bot} grup/kanal desteklemektedir.`,
            limit: plan.max_chats_per_bot,
            current: Number(count?.count || 0),
          });
          return false;
        }
        return true;
      }
      case 'team_members': {
        const count = await db.selectFrom('panel_users')
          .select(db.fn.count<number>('id').as('count'))
          .where('workspace_id', '=', workspaceId)
          .executeTakeFirst();

        if (Number(count?.count || 0) >= plan.max_team_members) {
          reply.code(403);
          reply.send({
            error: 'Plan Limit Aşıldı',
            message: `Planınız en fazla ${plan.max_team_members} ekip üyesi desteklemektedir.`,
            limit: plan.max_team_members,
            current: Number(count?.count || 0),
          });
          return false;
        }
        return true;
      }
      default:
        return true;
    }
  } catch (err) {
    console.error('[PLAN LIMIT] Error:', err);
    return true; // Hata durumunda geçici olarak izin ver
  }
}

/**
 * Helper: Belirtilen özelliğin planda olup olmadığını kontrol eder
 */
export async function hasFeature(workspaceId: number, featureKey: string): Promise<boolean> {
  try {
    const workspace = await workspaceRepository.findById(workspaceId);
    if (!workspace) return false;

    let plan: SubscriptionPlan | null = null;
    if (workspace.plan_id) {
      plan = (await planRepository.findById(workspace.plan_id)) || null;
    }
    if (!plan) {
      plan = (await planRepository.getDefaultPlan()) || null;
    }
    if (!plan || !plan.features) return false;

    const features: string[] = JSON.parse(plan.features);
    return features.includes(featureKey);
  } catch {
    return false;
  }
}
