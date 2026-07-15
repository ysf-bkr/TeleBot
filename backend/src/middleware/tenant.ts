import { FastifyReply, FastifyRequest } from 'fastify';

/**
 * Tenant middleware - workspace_id'yi request'e ekler
 *
 * Kaynaklar:
 * 1. JWT token'daki workspace_id
 * 2. X-Workspace-ID header (super admin için)
 * 3. Kullanıcının panel_users kaydındaki workspace_id
 */
export async function tenantMiddleware(request: FastifyRequest, reply: FastifyReply) {
  // 1. Header'dan workspace_id al (super admin override)
  const headerWorkspaceId = request.headers['x-workspace-id'];
  if (headerWorkspaceId) {
    const parsed = parseInt(String(headerWorkspaceId), 10);
    if (!isNaN(parsed)) {
      request.workspace_id = parsed;
      return;
    }
  }

  // 2. JWT token'dan al
  if ((request as any).user?.workspace_id) {
    request.workspace_id = (request as any).user.workspace_id;
    return;
  }

  // 3. Super admin super_admin ise workspace_id'siz çalışabilir
  if ((request as any).user?.role === 'super_admin') {
    // Super admin tüm workspace'leri görebilir, workspace_id set etme
    return;
  }

  // 4. Public rotalar için atla
  const publicPaths = ['/api/auth', '/api/health', '/p/', '/webhooks', '/api/setup', '/api/plans'];
  if (publicPaths.some(p => request.url.startsWith(p))) {
    return;
  }

  // Workspace ID yoksa ve zorunlu bir rota ise
  const requiresWorkspace = !request.url.startsWith('/api/auth')
    && !request.url.startsWith('/api/health')
    && !request.url.startsWith('/p/')
    && !request.url.startsWith('/webhooks')
    && !request.url.startsWith('/api/setup')
    && !request.url.startsWith('/api/plans')
    && !request.url.startsWith('/api/admin');

  if (requiresWorkspace && !request.workspace_id) {
    return reply.code(400).send({ error: 'Workspace ID required' });
  }
}
