export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  ok?: boolean;
}

export interface LoginResponse {
  token: string;
  user: {
    id: number | string;
    username: string;
    role?: string;
  };
}

export interface TelegramAuthData {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date?: number;
  hash?: string;
  isMock?: boolean;
}

export interface Chat {
  chat_id: string;
  title?: string | null;
  is_enabled?: number;
  member_count?: number;
  welcome_message?: string | null;
}

export interface ScheduledPostInput {
  chatId: string;
  content: string;
  parseMode?: string;
  scheduledAt: string;
  autoDeleteAfter?: number | null;
  buttons?: string | null;
}

export interface AnalyticsMetrics {
  [key: string]: number | string;
}

export interface BotStatus {
  connected: boolean;
  username?: string;
  first_name?: string;
  id?: number;
  lastError?: string | null;
  usingWebhook?: boolean;
  webhookUrl?: string;
  timestamp?: string;
}

export interface ChatUpdateEvent {
  action: 'added' | 'removed';
  chat?: any;
  chatId?: string;
}

export interface SchedulerPost {
  id: number;
  chat_id: string;
  content: string;
  parse_mode?: string | null;
  buttons?: string | null;
  scheduled_at: string;
  auto_delete_after?: number | null;
  status: string;
}
