// Common shared types for the frontend

export interface User {
  id: number | string;
  username: string;
  first_name?: string;
  role?: string;
  workspace_id?: number;
}

export interface Workspace {
  id: number;
  name: string;
  slug: string;
  owner_id: number | null;
  plan_id: number | null;
  status: string;
  bot_token: string | null;
  bot_username: string | null;
  settings: string | null;
  created_at: string;
  updated_at: string;
  subscription?: Subscription | null;
  plan?: SubscriptionPlan | null;
}

export interface SubscriptionPlan {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  max_bots: number;
  max_chats_per_bot: number;
  max_team_members: number;
  features: string | null;
  is_active: number;
  created_at: string;
}

export interface WorkspaceStats {
  bots: number;
  chats: number;
  logs: number;
  todayActivity: number;
  teamMembers: number;
}

export interface AdminStats {
  workspaces: number;
  plans: number;
  users: number;
}

export interface Chat {
  chat_id: string;
  title: string | null;
  type?: string | null;
  username?: string | null;
  is_enabled: number; // 0 | 1
  member_count?: number;
  welcome_message?: string | null;
  last_activity_at?: string | null;
}

export interface Log {
  id?: number;
  chat_id: string;
  chat_title?: string | null;
  user_id?: string | null;
  username?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  event_type: string;
  message_sent?: number;
  message_text?: string | null;
  timestamp: string;
}

export interface ModerationSettings {
  enabled: number;
  rules_text?: string | null;
  auto_delete_links?: number;
  auto_delete_bad_words?: number;
  auto_warn?: number;
  spam_threshold?: number;
  max_warnings?: number;
  action_after_warnings?: string;
}

export interface BlacklistWord {
  id: number;
  chat_id: string;
  word: string;
  created_at: string;
}

export interface ModerationLog {
  id?: number;
  chat_id: string;
  user_id?: string | null;
  username?: string | null;
  first_name?: string | null;
  action: string;
  reason?: string | null;
  message_text?: string | null;
  timestamp: string;
}

export interface ScheduledPost {
  id: number;
  chat_id: string;
  content: string;
  parse_mode?: string | null;
  buttons?: string | null;
  scheduled_at: string;
  status: 'pending' | 'sent' | 'failed' | 'deleted';
  message_id?: string | null;
  auto_delete_after?: number | null;
  created_at: string;
}

export interface Article {
  id: number;
  slug: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id?: number;
  user_id?: number | null;
  username?: string | null;
  action: string;
  details?: string | null;
  ip?: string | null;
  timestamp: string;
}

export interface BotStatus {
  connected: boolean;
  username?: string;
  first_name?: string;
  id?: number;
  lastError?: string | null;
}

export interface Subscription {
  id: number;
  user_id: string;
  chat_id?: string | null;
  plan?: string | null;
  status: string;
  expires_at?: string | null;
  stripe_id?: string | null;
  telegram_payment_charge_id?: string | null;
  created_at: string;
}

export interface PanelUser {
  id: number;
  username: string;
  role: string | null;
  created_at: string;
}

export interface CustomCommand {
  id: number;
  command: string;
  response: string;
  is_active: number;
  created_at: string;
}

export interface GlobalBlacklistItem {
  id: number;
  user_id: string;
  reason: string | null;
  added_at: string;
}

export interface CaptchaSession {
  id: number;
  chat_id: string;
  user_id: string;
  code: string;
  expires_at: string;
  verified: number;
}

export interface UserProfile {
  userId: string;
  totalMessages: number;
  totalJoins: number;
  lastSeen: string | null;
  recentLogs: Log[];
  moderationHistory: ModerationLog[];
  isGloballyBlacklisted: boolean;
  blacklistReason: string | null;
}

export interface ApiError {
  error?: string;
  message?: string;
}

// Response wrappers (when backend returns { data: ... } or direct)
export type ApiResponse<T> = T; // adjust if backend wraps consistently

// Re-export for convenience
export * from './index';
