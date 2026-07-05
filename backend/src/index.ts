import 'dotenv/config';
import Fastify from 'fastify';
import { Server } from 'http';
import { closeDb, initializeDatabase } from './db/index.js';
import { setupSocket } from './websocket/socket.js';

const fastify = Fastify({
  logger: { level: process.env.LOG_LEVEL || 'info' },
  trustProxy: true,
  ignoreTrailingSlash: true,
});

let io: Server | undefined;

async function startServer() {
  await initializeDatabase();

  // Register plugins
  await fastify.register((await import('@fastify/helmet')).default, {
    contentSecurityPolicy: false // Disable CSP so Swagger UI can render stylesheets
  });
  await fastify.register((await import('@fastify/cors')).default, {
    origin: process.env.CORS_ORIGIN || '*',
  });

  // Swagger Documentation for script distribution
  await fastify.register(import('@fastify/swagger'));
  await fastify.register(import('@fastify/swagger-ui'), {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false
    }
  });

  // Socket.io
  const rawServer: any = fastify.server;
  io = setupSocket(rawServer) as any;
  if (io) {
    fastify.decorate('io', io as any);
  }

  fastify.addHook('onRequest', async (request: any) => {
    request.io = io;
  });

  // License Validation hook for commercial distribution
  const { validateLicense } = await import('./middleware/license.js');
  fastify.addHook('onRequest', async (request, reply) => {
    await validateLicense(request, reply);
  });

  // === AUTH PLUGIN (Fastify native + JWT) ===
  const { default: authPlugin } = await import('./plugins/auth.js');
  await fastify.register(authPlugin);

  // Audit (now user may be populated)
  const { default: auditService } = await import('./modules/audit/audit.service.js');
  fastify.addHook('onResponse', async (request, reply) => {
    if (request.method !== 'GET' && (request as any).user) {
      await auditService.log(
        'api_call',
        { path: request.url },
        (request as any).user?.id,
        (request as any).user?.username,
        request.ip
      );
    }
  });

  // Audit router
  const { default: auditRouters } = await import('./modules/audit/audit.routers.js');
  await fastify.register(auditRouters, { prefix: '/api/audit' });

  // Protected + public API
  const { default: authRouters } = await import('./modules/auth/auth.routers.js');
  const { default: settingsRouters } = await import('./modules/settings/settings.routers.js');
  const { default: chatRouters } = await import('./modules/chat/chat.routers.js');
  const { default: logRouters } = await import('./modules/log/log.routers.js');
  const { default: moderationRouters } = await import('./modules/moderation/moderation.routers.js');
  const { default: schedRouters } = await import('./modules/scheduler/scheduler.routers.js');
  const { default: analRouters } = await import('./modules/analytics/analytics.routers.js');
  const { default: artsRouters } = await import('./modules/articles/articles.routers.js');
  const { default: commandsRouters } = await import('./modules/commands/commands.routers.js');
  const { default: paymentsRouters } = await import('./modules/payments/payments.routers.js');
  const { default: webhookRoutes } = await import('./routes/webhook.js');

  await fastify.register(authRouters, { prefix: '/api/auth' });
  await fastify.register(settingsRouters, { prefix: '/api/settings' });
  await fastify.register(chatRouters, { prefix: '/api/chats' });
  await fastify.register(logRouters, { prefix: '/api/logs' });
  await fastify.register(moderationRouters, { prefix: '/api/moderation' });
  await fastify.register(schedRouters, { prefix: '/api/scheduler' });
  await fastify.register(analRouters, { prefix: '/api/analytics' });
  await fastify.register(artsRouters, { prefix: '/api/articles' });
  await fastify.register(commandsRouters, { prefix: '/api/commands' });
  await fastify.register(paymentsRouters, { prefix: '/api/payments' });

  // Setup Wizard Router
  const { default: setupRouters } = await import('./modules/setup/setup.routers.js');
  await fastify.register(setupRouters, { prefix: '/api/setup' });

  // Public article page
  const { default: articlesController } = await import('./modules/articles/articles.controller.js');
  fastify.get('/p/:slug', articlesController.renderArticle);

  await fastify.register(webhookRoutes, { prefix: '/webhooks' });

  fastify.get('/api/health', async () => ({ status: 'ok', time: new Date().toISOString() }));

  fastify.get('/', async () => ({
    name: 'Telegram Bot Platform (Fastify + TS)',
    version: '2.1',
  }));

  const PORT = process.env.PORT || 3000;
  await fastify.listen({ port: Number(PORT), host: '0.0.0.0' });
  console.log(`[FASTIFY] Server running on http://localhost:${PORT}`);

  // Seed + bots
  const { default: authService } = await import('./modules/auth/auth.service.js');
  await authService.ensureDefaultAdmin();

  // Initialize license server heartbeat verification
  const { default: licenseService } = await import('./services/license.service.js');
  await licenseService.verifyHeartbeat();
  // Check heartbeat every 24 hours
  setInterval(async () => {
    await licenseService.verifyHeartbeat();
  }, 24 * 60 * 60 * 1000);

  const { default: botService } = await import('./services/bot.service.js');
  await botService.startAllBots(io as any);

  // Start scheduler runner (TS service)
  const { default: schedulerService } = await import('./modules/scheduler/scheduler.service.js');
  schedulerService.startRunner(io, 30000);
}

process.on('SIGINT', async () => {
  console.log('\n[FASTIFY] Shutting down...');
  const { default: botService } = await import('./services/bot.service.js');
  await botService.stopAllBots();
  await closeDb();
  await fastify.close();
  process.exit(0);
});

startServer().catch((err) => {
  console.error(err);
  process.exit(1);
});
