import { Generated, Insertable, Selectable, Updateable } from 'kysely';

export interface BotConfigTable {
  id: Generated<number>;
  token: string | null;
  welcome_message: string;
  welcome_enabled: number; // 0/1
  parse_mode: string;
  webhook_domain: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChatTable {
  id: Generated<number>;
  chat_id: string;
  title: string | null;
  type: string | null;
  username: string | null;
  is_enabled: number;
  welcome_message: string | null;
  member_count: number;
  last_activity_at: string | null;
  description: string | null;
  invite_link: string | null;
  joined_at: string;
  updated_at: string;
}

export interface LogTable {
  id: Generated<number>;
  chat_id: string;
  chat_title: string | null;
  user_id: string | null;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  event_type: string;
  message_sent: number;
  message_text: string | null;
  timestamp: string;
}

export interface PanelUserTable {
  id: Generated<number>;
  username: string;
  password_hash: string;
  role: string | null; // 'admin' | 'moderator' etc
  created_at: string;
}

export interface ModerationSettingTable {
  id: Generated<number>;
  chat_id: string;
  enabled: number;
  rules_text: string | null;
  auto_delete_links: number;
  auto_delete_bad_words: number;
  auto_warn: number;
  spam_threshold: number;
  max_warnings: number;
  action_after_warnings: string;
  ai_moderation_enabled: number | null;
  captcha_enabled: number | null;
  updated_at: string;
}

export interface BlacklistWordTable {
  id: Generated<number>;
  chat_id: string;
  word: string;
  created_at: string;
}

export interface ModerationLogTable {
  id: Generated<number>;
  chat_id: string;
  user_id: string | null;
  username: string | null;
  first_name: string | null;
  action: string;
  reason: string | null;
  message_text: string | null;
  timestamp: string;
}

export interface ScheduledPostTable {
  id: Generated<number>;
  chat_id: string;
  content: string;
  parse_mode: string | null;
  buttons: string | null;
  scheduled_at: string;
  repeat_interval: string | null;
  status: string; // pending | sent | failed | deleted
  message_id: string | null;
  auto_delete_after: number | null;
  created_at: string;
  sent_at?: string | null;
}

export interface SubscriptionTable {
  id: Generated<number>;
  user_id: string;
  chat_id: string | null;
  plan: string | null;
  status: string;
  expires_at: string | null;
  stripe_id: string | null;
  telegram_payment_charge_id: string | null;
  created_at: string;
}

export interface AuditLogTable {
  id: Generated<number>;
  user_id: number | null;
  username: string | null;
  action: string;
  details: string | null;
  ip: string | null;
  timestamp: string;
}

export interface GlobalBlacklistTable {
  id: Generated<number>;
  user_id: string;
  reason: string | null;
  added_at: string;
}

export interface ChatEventTable {
  id: Generated<number>;
  chat_id: string;
  event_type: string;
  user_id: string | null;
  username: string | null;
  timestamp: string;
}

export interface CaptchaSessionTable {
  id: Generated<number>;
  chat_id: string;
  user_id: string;
  code: string;
  expires_at: string;
  verified: number;
}

export interface ArticleTable {
  id: Generated<number>;
  slug: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface CustomCommandTable {
  id: Generated<number>;
  command: string;
  response: string;
  is_active: Generated<number>;
  created_at: string;
}

export interface AutoReplyTable {
  id: Generated<number>;
  chat_id: string;
  trigger: string;
  response: string;
  match_type: Generated<string>;
  is_active: Generated<number>;
  created_at: string;
}

export interface ChatTemplateTable {
  id: Generated<number>;
  name: string;
  settings: string;
  created_at: string;
}

export interface ChatAdminTable {
  id: Generated<number>;
  chat_id: string;
  user_id: string;
  username: string | null;
  first_name: string | null;
  is_creator: Generated<number> | null;
  created_at: string;
}

export interface DeletedMessageTable {
  id: Generated<number>;
  chat_id: string;
  user_id: string | null;
  username: string | null;
  message_text: string | null;
  deleted_at: string;
}

export interface EditedMessageTable {
  id: Generated<number>;
  chat_id: string;
  user_id: string | null;
  username: string | null;
  old_text: string | null;
  new_text: string | null;
  edited_at: string;
}

export interface Database {
  bot_config: BotConfigTable;
  chats: ChatTable;
  logs: LogTable;
  panel_users: PanelUserTable;
  moderation_settings: ModerationSettingTable;
  blacklist_words: BlacklistWordTable;
  moderation_logs: ModerationLogTable;
  scheduled_posts: ScheduledPostTable;
  subscriptions: SubscriptionTable;
  audit_logs: AuditLogTable;
  global_blacklist: GlobalBlacklistTable;
  chat_events: ChatEventTable;
  captcha_sessions: CaptchaSessionTable;
  articles: ArticleTable;
  custom_commands: CustomCommandTable;
  auto_replies: AutoReplyTable;
  chat_templates: ChatTemplateTable;
  chat_admins: ChatAdminTable;
  deleted_messages: DeletedMessageTable;
  edited_messages: EditedMessageTable;
}

// Select/Insert/Update helpers
export type BotConfig = Selectable<BotConfigTable>;
export type NewBotConfig = Insertable<BotConfigTable>;
export type BotConfigUpdate = Updateable<BotConfigTable>;

export type Chat = Selectable<ChatTable>;
export type NewChat = Insertable<ChatTable>;
export type ChatUpdate = Updateable<ChatTable>;

// ... add more as needed for other tables
export type ScheduledPost = Selectable<ScheduledPostTable>;
export type NewScheduledPost = Insertable<ScheduledPostTable>;

export type AuditLog = Selectable<AuditLogTable>;
export type Article = Selectable<ArticleTable>;

export type ModerationLog = Selectable<ModerationLogTable>;
export type NewModerationLog = Insertable<ModerationLogTable>;

export type ModerationSetting = Selectable<ModerationSettingTable>;
export type NewModerationSetting = Insertable<ModerationSettingTable>;

export type PanelUser = Selectable<PanelUserTable>;
export type NewPanelUser = Insertable<PanelUserTable>;

export type Subscription = Selectable<SubscriptionTable>;
export type NewSubscription = Insertable<SubscriptionTable>;

export type GlobalBlacklist = Selectable<GlobalBlacklistTable>;
export type NewGlobalBlacklist = Insertable<GlobalBlacklistTable>;

export type BlacklistWord = Selectable<BlacklistWordTable>;
export type NewBlacklistWord = Insertable<BlacklistWordTable>;

// For bot multi-instance
export interface BotStatus {
  connected: boolean;
  username?: string;
  first_name?: string;
  id?: number;
  lastError?: string | null;
  usingWebhook?: boolean;
  webhookUrl?: string;
}
