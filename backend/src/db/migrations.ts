/**
 * Simple migration runner for Kysely + SQLite.
 * Creates tables if they don't exist. Idempotent.
 */
import { Kysely } from 'kysely';
import type { Database } from '../types/db.js';

export async function runMigrations(db: Kysely<Database>) {
  // ============================================================
  // SAAS / TENANT TABLOLARI (Önce oluşturulmalı)
  // ============================================================

  // Workspace (Tenant) tablosu
  await db.schema
    .createTable('workspaces')
    .ifNotExists()
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('slug', 'text', (col) => col.notNull().unique())
    .addColumn('owner_id', 'integer')
    .addColumn('plan_id', 'integer')
    .addColumn('status', 'text', (col) => col.notNull().defaultTo('trial'))
    .addColumn('bot_token', 'text')
    .addColumn('bot_username', 'text')
    .addColumn('settings', 'text')
    .addColumn('created_at', 'text', (col) => col.notNull().defaultTo('CURRENT_TIMESTAMP'))
    .addColumn('updated_at', 'text', (col) => col.notNull().defaultTo('CURRENT_TIMESTAMP'))
    .execute();

  // Subscription plans tablosu
  await db.schema
    .createTable('subscription_plans')
    .ifNotExists()
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('slug', 'text', (col) => col.notNull().unique())
    .addColumn('description', 'text')
    .addColumn('price_monthly', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('price_yearly', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('max_bots', 'integer', (col) => col.notNull().defaultTo(1))
    .addColumn('max_chats_per_bot', 'integer', (col) => col.notNull().defaultTo(10))
    .addColumn('max_team_members', 'integer', (col) => col.notNull().defaultTo(1))
    .addColumn('features', 'text') // JSON array
    .addColumn('is_active', 'integer', (col) => col.notNull().defaultTo(1))
    .addColumn('created_at', 'text', (col) => col.notNull().defaultTo('CURRENT_TIMESTAMP'))
    .execute();

  // Seed default plans
  await seedDefaultPlans(db);

  // ============================================================
  // MEVCUT TABLOLAR (workspace_id kolonu eklendi)
  // ============================================================

  // bot_config
  await db.schema
    .createTable('bot_config')
    .ifNotExists()
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('workspace_id', 'integer') // TENANT
    .addColumn('token', 'text')
    .addColumn('welcome_message', 'text', (col) =>
      col.notNull().defaultTo(
        '👋 Hoş geldin {first_name}!\nGrubumuza katıldığın için teşekkürler.\n\nLütfen kurallara uy.\n{group_title}'
      )
    )
    .addColumn('welcome_enabled', 'integer', (col) => col.notNull().defaultTo(1))
    .addColumn('parse_mode', 'text', (col) => col.notNull().defaultTo('HTML'))
    .addColumn('webhook_domain', 'text')
    .addColumn('settings', 'text')
    .addColumn('created_at', 'text', (col) =>
      col.notNull().defaultTo('CURRENT_TIMESTAMP')
    )
    .addColumn('updated_at', 'text', (col) =>
      col.notNull().defaultTo('CURRENT_TIMESTAMP')
    )
    .execute();

  // Alter table for existing databases if settings column is missing
  try {
    const tableInfo = await db.introspection.getTables();
    const botConfigTable = tableInfo.find(t => t.name === 'bot_config');
    const hasSettings = botConfigTable?.columns.some(c => c.name === 'settings');
    if (botConfigTable && !hasSettings) {
      await db.schema.alterTable('bot_config').addColumn('settings', 'text').execute();
      console.log('[MIGRATION] Added settings column to bot_config table.');
    }
  } catch (e) {
    console.error('[MIGRATION] Error altering bot_config:', e);
  }

  // Ensure webhook_domain column exists (for existing DBs)
  await addColumnIfNotExists(db, 'bot_config', 'webhook_domain', 'TEXT');
  // Ensure workspace_id column exists
  await addColumnIfNotExists(db, 'bot_config', 'workspace_id', 'INTEGER');

  // chats
  await db.schema
    .createTable('chats')
    .ifNotExists()
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('workspace_id', 'integer') // TENANT
    .addColumn('chat_id', 'text', (col) => col.notNull().unique())
    .addColumn('title', 'text')
    .addColumn('type', 'text')
    .addColumn('username', 'text')
    .addColumn('is_enabled', 'integer', (col) => col.notNull().defaultTo(1))
    .addColumn('joined_at', 'text', (col) => col.notNull().defaultTo('CURRENT_TIMESTAMP'))
    .addColumn('updated_at', 'text', (col) => col.notNull().defaultTo('CURRENT_TIMESTAMP'))
    .execute();

  // logs
  await db.schema
    .createTable('logs')
    .ifNotExists()
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('workspace_id', 'integer') // TENANT
    .addColumn('chat_id', 'text', (col) => col.notNull())
    .addColumn('chat_title', 'text')
    .addColumn('user_id', 'text')
    .addColumn('username', 'text')
    .addColumn('first_name', 'text')
    .addColumn('last_name', 'text')
    .addColumn('event_type', 'text', (col) => col.notNull())
    .addColumn('message_sent', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('message_text', 'text')
    .addColumn('timestamp', 'text', (col) => col.notNull().defaultTo('CURRENT_TIMESTAMP'))
    .execute();

  // panel_users
  await db.schema
    .createTable('panel_users')
    .ifNotExists()
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('workspace_id', 'integer') // TENANT
    .addColumn('username', 'text', (col) => col.notNull().unique())
    .addColumn('password_hash', 'text', (col) => col.notNull())
    .addColumn('role', 'text', (col) => col.defaultTo('user'))
    .addColumn('created_at', 'text', (col) => col.notNull().defaultTo('CURRENT_TIMESTAMP'))
    .execute();

  // Optional index
  await db.schema
    .createIndex('idx_logs_chat_id')
    .ifNotExists()
    .on('logs')
    .column('chat_id')
    .execute();

  // === Multi-group enhancements ===
  // Add columns to chats table for per-group settings (idempotent)
  await addColumnIfNotExists(db, 'chats', 'welcome_message', 'TEXT');
  await addColumnIfNotExists(db, 'chats', 'member_count', 'INTEGER DEFAULT 0');
  await addColumnIfNotExists(db, 'chats', 'last_activity_at', 'TEXT');
  await addColumnIfNotExists(db, 'chats', 'workspace_id', 'INTEGER');

  // === Grup Moderasyon ve Topluluk Yönetimi ===
  // Moderation settings per chat
  await db.schema
    .createTable('moderation_settings')
    .ifNotExists()
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('workspace_id', 'integer') // TENANT
    .addColumn('chat_id', 'text', (col) => col.notNull().unique())
    .addColumn('enabled', 'integer', (col) => col.notNull().defaultTo(1))
    .addColumn('rules_text', 'text')
    .addColumn('auto_delete_links', 'integer', (col) => col.defaultTo(0))
    .addColumn('auto_delete_bad_words', 'integer', (col) => col.defaultTo(1))
    .addColumn('auto_warn', 'integer', (col) => col.defaultTo(1))
    .addColumn('spam_threshold', 'integer', (col) => col.defaultTo(5))
    .addColumn('max_warnings', 'integer', (col) => col.defaultTo(3))
    .addColumn('action_after_warnings', 'text', (col) => col.defaultTo('kick')) // kick | ban | mute
    .addColumn('ai_moderation_enabled', 'integer', (col) => col.defaultTo(0))
    .addColumn('captcha_enabled', 'integer', (col) => col.defaultTo(0))
    .addColumn('updated_at', 'text', (col) => col.notNull().defaultTo('CURRENT_TIMESTAMP'))
    .execute();

  // Ensure columns exist (for existing DBs)
  await addColumnIfNotExists(db, 'moderation_settings', 'ai_moderation_enabled', 'INTEGER DEFAULT 0');
  await addColumnIfNotExists(db, 'moderation_settings', 'captcha_enabled', 'INTEGER DEFAULT 0');
  await addColumnIfNotExists(db, 'moderation_settings', 'workspace_id', 'INTEGER');

  // Blacklist words
  await db.schema
    .createTable('blacklist_words')
    .ifNotExists()
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('workspace_id', 'integer') // TENANT
    .addColumn('chat_id', 'text', (col) => col.notNull())
    .addColumn('word', 'text', (col) => col.notNull())
    .addColumn('created_at', 'text', (col) => col.notNull().defaultTo('CURRENT_TIMESTAMP'))
    .execute();

  // Moderation action logs (violations)
  await db.schema
    .createTable('moderation_logs')
    .ifNotExists()
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('workspace_id', 'integer') // TENANT
    .addColumn('chat_id', 'text', (col) => col.notNull())
    .addColumn('user_id', 'text')
    .addColumn('username', 'text')
    .addColumn('first_name', 'text')
    .addColumn('action', 'text', (col) => col.notNull()) // delete | warn | kick | ban | mute
    .addColumn('reason', 'text')
    .addColumn('message_text', 'text')
    .addColumn('timestamp', 'text', (col) => col.notNull().defaultTo('CURRENT_TIMESTAMP'))
    .execute();

  // Indexes
  await db.schema
    .createIndex('idx_moderation_logs_chat')
    .ifNotExists()
    .on('moderation_logs')
    .column('chat_id')
    .execute();

  await db.schema
    .createIndex('idx_blacklist_chat')
    .ifNotExists()
    .on('blacklist_words')
    .column('chat_id')
    .execute();

  // === Enterprise Features ===

  // Scheduled posts for content scheduler
  await db.schema
    .createTable('scheduled_posts')
    .ifNotExists()
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('workspace_id', 'integer') // TENANT
    .addColumn('chat_id', 'text', (col) => col.notNull())
    .addColumn('content', 'text', (col) => col.notNull())
    .addColumn('parse_mode', 'text')
    .addColumn('buttons', 'text') // JSON string for inline buttons
    .addColumn('scheduled_at', 'text', (col) => col.notNull())
    .addColumn('repeat_interval', 'text') // e.g. 'weekly', 'daily'
    .addColumn('status', 'text', (col) => col.notNull().defaultTo('pending'))
    .addColumn('message_id', 'text')
    .addColumn('auto_delete_after', 'integer') // seconds
    .addColumn('created_at', 'text', (col) => col.notNull().defaultTo('CURRENT_TIMESTAMP'))
    .execute();

  // Subscriptions for payments (tenant bazlı)
  await db.schema
    .createTable('subscriptions')
    .ifNotExists()
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('workspace_id', 'integer') // TENANT
    .addColumn('user_id', 'text', (col) => col.notNull())
    .addColumn('plan_id', 'integer')
    .addColumn('plan_slug', 'text')
    .addColumn('status', 'text', (col) => col.notNull().defaultTo('active'))
    .addColumn('expires_at', 'text')
    .addColumn('stripe_id', 'text')
    .addColumn('telegram_payment_charge_id', 'text')
    .addColumn('trial_ends_at', 'text')
    .addColumn('created_at', 'text', (col) => col.notNull().defaultTo('CURRENT_TIMESTAMP'))
    .execute();

  // Audit logs for RBAC and team management
  await db.schema
    .createTable('audit_logs')
    .ifNotExists()
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('workspace_id', 'integer') // TENANT
    .addColumn('user_id', 'integer')
    .addColumn('username', 'text')
    .addColumn('action', 'text', (col) => col.notNull())
    .addColumn('details', 'text')
    .addColumn('ip', 'text')
    .addColumn('timestamp', 'text', (col) => col.notNull().defaultTo('CURRENT_TIMESTAMP'))
    .execute();

  // Global blacklist (spammers across all bots)
  await db.schema
    .createTable('global_blacklist')
    .ifNotExists()
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('user_id', 'text', (col) => col.notNull().unique())
    .addColumn('reason', 'text')
    .addColumn('added_at', 'text', (col) => col.notNull().defaultTo('CURRENT_TIMESTAMP'))
    .execute();

  // Chat events for analytics
  await db.schema
    .createTable('chat_events')
    .ifNotExists()
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('workspace_id', 'integer') // TENANT
    .addColumn('chat_id', 'text', (col) => col.notNull())
    .addColumn('event_type', 'text', (col) => col.notNull()) // join, leave, message, moderation
    .addColumn('user_id', 'text')
    .addColumn('username', 'text')
    .addColumn('timestamp', 'text', (col) => col.notNull().defaultTo('CURRENT_TIMESTAMP'))
    .execute();

  // Captcha sessions for mini-app verification
  await db.schema
    .createTable('captcha_sessions')
    .ifNotExists()
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('workspace_id', 'integer') // TENANT
    .addColumn('chat_id', 'text', (col) => col.notNull())
    .addColumn('user_id', 'text', (col) => col.notNull())
    .addColumn('code', 'text', (col) => col.notNull())
    .addColumn('expires_at', 'text', (col) => col.notNull())
    .addColumn('verified', 'integer', (col) => col.defaultTo(0))
    .execute();

  // Articles (Telegraph clone)
  await db.schema
    .createTable('articles')
    .ifNotExists()
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('slug', 'text', (col) => col.notNull().unique())
    .addColumn('title', 'text', (col) => col.notNull())
    .addColumn('content', 'text', (col) => col.notNull())
    .addColumn('created_at', 'text', (col) => col.notNull().defaultTo('CURRENT_TIMESTAMP'))
    .addColumn('updated_at', 'text', (col) => col.notNull().defaultTo('CURRENT_TIMESTAMP'))
    .execute();

  // Custom Commands (Automated trigger/response)
  await db.schema
    .createTable('custom_commands')
    .ifNotExists()
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('workspace_id', 'integer') // TENANT
    .addColumn('command', 'text', (col) => col.notNull().unique())
    .addColumn('response', 'text', (col) => col.notNull())
    .addColumn('is_active', 'integer', (col) => col.notNull().defaultTo(1))
    .addColumn('created_at', 'text', (col) => col.notNull().defaultTo('CURRENT_TIMESTAMP'))
    .execute();

  // Ensure is_active exists for existing databases
  await addColumnIfNotExists(db, 'custom_commands', 'is_active', 'INTEGER DEFAULT 1');
  await addColumnIfNotExists(db, 'custom_commands', 'workspace_id', 'INTEGER');

  // Indexes
  await db.schema
    .createIndex('idx_scheduled_status')
    .ifNotExists()
    .on('scheduled_posts')
    .column('status')
    .execute();

  await db.schema
    .createIndex('idx_events_chat_time')
    .ifNotExists()
    .on('chat_events')
    .columns(['chat_id', 'timestamp'])
    .execute();

  await db.schema
    .createIndex('idx_events_workspace')
    .ifNotExists()
    .on('chat_events')
    .column('workspace_id')
    .execute();

  // === Yeni Özellikler için Tablolar ===

  // Auto-reply rules (Otomatik Yanıtlayıcı)
  await db.schema
    .createTable('auto_replies')
    .ifNotExists()
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('workspace_id', 'integer') // TENANT
    .addColumn('chat_id', 'text', (col) => col.notNull())
    .addColumn('trigger', 'text', (col) => col.notNull())
    .addColumn('response', 'text', (col) => col.notNull())
    .addColumn('match_type', 'text', (col) => col.notNull().defaultTo('exact')) // exact | contains | regex
    .addColumn('is_active', 'integer', (col) => col.notNull().defaultTo(1))
    .addColumn('created_at', 'text', (col) => col.notNull().defaultTo('CURRENT_TIMESTAMP'))
    .execute();

  // Chat templates (Grup Şablonları)
  await db.schema
    .createTable('chat_templates')
    .ifNotExists()
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('name', 'text', (col) => col.notNull().unique())
    .addColumn('settings', 'text', (col) => col.notNull()) // JSON string
    .addColumn('created_at', 'text', (col) => col.notNull().defaultTo('CURRENT_TIMESTAMP'))
    .execute();

  // Chat admins (Yönetici listesi cache)
  await db.schema
    .createTable('chat_admins')
    .ifNotExists()
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('workspace_id', 'integer') // TENANT
    .addColumn('chat_id', 'text', (col) => col.notNull())
    .addColumn('user_id', 'text', (col) => col.notNull())
    .addColumn('username', 'text')
    .addColumn('first_name', 'text')
    .addColumn('is_creator', 'integer', (col) => col.defaultTo(0))
    .addColumn('created_at', 'text', (col) => col.notNull().defaultTo('CURRENT_TIMESTAMP'))
    .execute();

  // Deleted messages log (Silinen mesajlar geçmişi)
  await db.schema
    .createTable('deleted_messages')
    .ifNotExists()
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('workspace_id', 'integer') // TENANT
    .addColumn('chat_id', 'text', (col) => col.notNull())
    .addColumn('user_id', 'text')
    .addColumn('username', 'text')
    .addColumn('message_text', 'text')
    .addColumn('deleted_at', 'text', (col) => col.notNull().defaultTo('CURRENT_TIMESTAMP'))
    .execute();

  // Edited messages log (Düzenlenen mesajlar geçmişi)
  await db.schema
    .createTable('edited_messages')
    .ifNotExists()
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('workspace_id', 'integer') // TENANT
    .addColumn('chat_id', 'text', (col) => col.notNull())
    .addColumn('user_id', 'text')
    .addColumn('username', 'text')
    .addColumn('old_text', 'text')
    .addColumn('new_text', 'text')
    .addColumn('edited_at', 'text', (col) => col.notNull().defaultTo('CURRENT_TIMESTAMP'))
    .execute();

  // Add description column to chats table
  await addColumnIfNotExists(db, 'chats', 'description', 'TEXT');
  await addColumnIfNotExists(db, 'chats', 'invite_link', 'TEXT');

  // Add role column to panel_users for RBAC
  await addColumnIfNotExists(db, 'panel_users', 'role', 'TEXT DEFAULT "user"');
  await addColumnIfNotExists(db, 'panel_users', 'workspace_id', 'INTEGER');

  // Indexes for new tables
  await db.schema
    .createIndex('idx_auto_replies_chat')
    .ifNotExists()
    .on('auto_replies')
    .column('chat_id')
    .execute();

  await db.schema
    .createIndex('idx_chat_admins_chat')
    .ifNotExists()
    .on('chat_admins')
    .column('chat_id')
    .execute();

  await db.schema
    .createIndex('idx_deleted_messages_chat')
    .ifNotExists()
    .on('deleted_messages')
    .column('chat_id')
    .execute();

  // Workspace indexes
  await db.schema
    .createIndex('idx_workspace_slug')
    .ifNotExists()
    .on('workspaces')
    .column('slug')
    .execute();

  await db.schema
    .createIndex('idx_subscriptions_workspace')
    .ifNotExists()
    .on('subscriptions')
    .column('workspace_id')
    .execute();

  await db.schema
    .createIndex('idx_bot_config_workspace')
    .ifNotExists()
    .on('bot_config')
    .column('workspace_id')
    .execute();

  console.log('[DB] Tables ensured (migrations applied)');
}

async function seedDefaultPlans(db: Kysely<Database>) {
  const existingPlans = await db.selectFrom('subscription_plans')
    .select(db.fn.count<number>('id').as('count'))
    .executeTakeFirst();

  if (Number(existingPlans?.count || 0) > 0) {
    console.log('[DB] Plans already seeded, skipping.');
    return;
  }

  const plans = [
    {
      name: 'Free',
      slug: 'free',
      description: 'Başlangıç seviyesi, tek bot ve sınırlı özellikler',
      price_monthly: 0,
      price_yearly: 0,
      max_bots: 1,
      max_chats_per_bot: 5,
      max_team_members: 1,
      features: JSON.stringify(['basic_moderation', 'activity_logs', 'welcome_messages']),
      is_active: 1,
    },
    {
      name: 'Pro',
      slug: 'pro',
      description: 'Profesyonel kullanıcılar için, gelişmiş özellikler',
      price_monthly: 29,
      price_yearly: 290,
      max_bots: 3,
      max_chats_per_bot: 50,
      max_team_members: 5,
      features: JSON.stringify([
        'basic_moderation', 'activity_logs', 'welcome_messages',
        'advanced_moderation', 'scheduler', 'captcha',
        'custom_commands', 'auto_reply', 'analytics',
        'team_management', 'api_access'
      ]),
      is_active: 1,
    },
    {
      name: 'Enterprise',
      slug: 'enterprise',
      description: 'Büyük ölçekli işletmeler için sınırsız özellikler',
      price_monthly: 99,
      price_yearly: 990,
      max_bots: 10,
      max_chats_per_bot: 500,
      max_team_members: 50,
      features: JSON.stringify([
        'basic_moderation', 'activity_logs', 'welcome_messages',
        'advanced_moderation', 'scheduler', 'captcha',
        'custom_commands', 'auto_reply', 'analytics',
        'team_management', 'api_access', 'white_label',
        'priority_support', 'custom_integrations'
      ]),
      is_active: 1,
    },
  ];

  for (const plan of plans) {
    await db.insertInto('subscription_plans').values(plan).execute();
  }
  console.log('[DB] Default subscription plans seeded.');
}

/**
 * Safely add a column to a table if it doesn't exist (SQLite compatible)
 */
async function addColumnIfNotExists(db: Kysely<Database>, table: string, column: string, typeDefinition: string) {
  try {
    // Use direct query for PRAGMA (cast to bypass strict CompiledQuery typing)
    const pragmaQuery: any = {
      sql: `PRAGMA table_info(${table})`,
      parameters: [],
    };
    const tableInfo = await db.executeQuery(pragmaQuery);

    const columnExists = tableInfo.rows.some(
      (row: any) => row.name === column
    );

    if (!columnExists) {
      const alterQuery: any = {
        sql: `ALTER TABLE ${table} ADD COLUMN ${column} ${typeDefinition}`,
        parameters: [],
      };
      await db.executeQuery(alterQuery);
      console.log(`[DB] Added column ${column} to ${table}`);
    }
  } catch (err: any) {
    if (!err.message?.toLowerCase().includes('duplicate column')) {
      console.warn(`[DB] Could not add column ${column} to ${table}:`, err.message);
    }
  }
}
