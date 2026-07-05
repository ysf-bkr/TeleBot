import { FastifyInstance } from 'fastify';
import { getDb } from '../../db/index.js';

async function auditRouters(fastify: FastifyInstance): Promise<void> {
  // GET /api/audit/logs - Pagination, search, filter, sort
  fastify.get('/logs', async (request: any, reply: any) => {
    try {
      const db = getDb();
      const query: any = request.query || {};

      const page = Math.max(1, Number(query.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(query.limit) || 30));
      const offset = (page - 1) * limit;
      const search = (query.search || '').trim();
      const action = (query.action || '').trim();
      const sortBy = query.sortBy || 'timestamp';
      const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

      // Build base query
      let baseQuery = db.selectFrom('audit_logs');
      let countQuery = db.selectFrom('audit_logs');

      // Search filter
      if (search) {
        const searchPattern = `%${search}%`;
        const searchFilter = (qb: any) => qb
          .where('action', 'like', searchPattern)
          .orWhere('username', 'like', searchPattern)
          .orWhere('details', 'like', searchPattern)
          .orWhere('ip', 'like', searchPattern);
        baseQuery = baseQuery.where(searchFilter);
        countQuery = countQuery.where(searchFilter);
      }

      // Action filter
      if (action) {
        baseQuery = baseQuery.where('action', '=', action);
        countQuery = countQuery.where('action', '=', action);
      }

      // Get total count
      const countResult = await countQuery
        .select(db.fn.countAll<number>().as('total'))
        .executeTakeFirst();
      const total = Number(countResult?.total || 0);

      // Get paginated data
      const allowedSortColumns = ['timestamp', 'action', 'username', 'user_id'];
      const safeSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'timestamp';

      const logs = await baseQuery
        .selectAll()
        .orderBy(safeSortBy, sortOrder)
        .limit(limit)
        .offset(offset)
        .execute();

      return {
        data: logs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: offset + limit < total,
          hasPrev: page > 1,
        },
      };
    } catch (err: any) {
      reply.code(500);
      return { error: err.message };
    }
  });

  // GET /api/audit/actions - Get distinct action types for filter
  fastify.get('/actions', async (_request: any, reply: any) => {
    try {
      const db = getDb();
      const result = await db.selectFrom('audit_logs')
        .select('action')
        .distinct()
        .orderBy('action', 'asc')
        .execute();
      return result.map((r: any) => r.action);
    } catch (err: any) {
      reply.code(500);
      return { error: err.message };
    }
  });
}

export default auditRouters;
