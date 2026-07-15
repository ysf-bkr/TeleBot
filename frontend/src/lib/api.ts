import axios, { AxiosError } from 'axios';
import { toast } from 'sonner';
import type {
  Article,
  AuditLog,
  BlacklistWord,
  BotStatus,
  CaptchaSession,
  Chat,
  CustomCommand,
  GlobalBlacklistItem,
  Log,
  ModerationLog,
  ModerationSettings,
  ScheduledPost,
  Subscription,
  User,
  UserProfile,
} from '../types';

// Single source of truth for ALL API calls
const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
});

// Request interceptor (attach token if needed - also done via setAuthToken)
api.interceptors.request.use((config) => {
  return config;
});

// Response interceptor: central error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status;
    const message = (error.response?.data as any)?.error || error.message || 'Bir hata oluştu';

    if (status === 401) {
      // Token expired or invalid - clear and notify
      localStorage.removeItem('token');
      window.dispatchEvent(new Event('auth_logout'));
      // Let the app handle logout via App state
      toast.error('Oturum süresi doldu. Lütfen tekrar giriş yapın.');
    } else if (status && status >= 500) {
      toast.error('Sunucu hatası. Lütfen daha sonra tekrar deneyin.');
    } else {
      // Only toast for non-2xx if desired. Many calls handle their own toasts.
      // Keep silent for most, let callers decide.
    }

    return Promise.reject(error);
  }
);

export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
}

// ==================== TYPED API GROUPS (Single file for all calls) ====================

export const auth = {
  login: (data: any) => api.post<{ token: string; user: User }>('/auth/login', data),
  loginEmail: (data: any) => api.post<{ token: string; user: User }>('/auth/login-email', data),
  registerEmail: (data: any) => api.post<{ token: string; user: User }>('/auth/register', data),
  config: () => api.get<{ botUsername?: string }>('/auth/config'),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data: any) => api.post('/auth/reset-password', data),
};

export const settings = {
  get: () => api.get<any>('/settings'),
  update: (data: any) => api.patch('/settings', data),
  setToken: (token: string) => api.post('/settings/token', { token }),
  restart: () => api.post('/settings/restart'),
  getBotInfo: () => api.get<BotStatus>('/settings/bot-info'),
  updateProfile: (data: { name?: string; description?: string }) => api.post('/settings/profile', data),
};

export const chatsApi = {
  list: () => api.get<Chat[]>('/chats'),
  get: (chatId: string) => api.get<Chat>(`/chats/${chatId}`),
  toggle: (chatId: string, isEnabled: boolean) =>
    api.patch<Chat>(`/chats/${chatId}/toggle`, { isEnabled }),
  update: (chatId: string, data: Partial<Chat>) =>
    api.patch<Chat>(`/chats/${chatId}`, data),
  // Yeni özellikler
  messages: (chatId: string, limit = 50) => api.get(`/chats/${chatId}/messages`, { params: { limit } }),
  members: (chatId: string) => api.get(`/chats/${chatId}/members`),
  admins: (chatId: string) => api.get(`/chats/${chatId}/admins`),
  setAdmin: (chatId: string, userId: string, isAdmin: boolean) => api.post(`/chats/${chatId}/admins`, { userId, isAdmin }),
  removeAdmin: (chatId: string, userId: string) => api.delete(`/chats/${chatId}/admins/${userId}`),
  autoReplies: (chatId: string) => api.get(`/chats/${chatId}/auto-replies`),
  createAutoReply: (chatId: string, data: { trigger: string; response: string; matchType?: string }) => api.post(`/chats/${chatId}/auto-replies`, data),
  deleteAutoReply: (chatId: string, replyId: number) => api.delete(`/chats/${chatId}/auto-replies/${replyId}`),
  deletedMessages: (chatId: string, limit = 30) => api.get(`/chats/${chatId}/deleted-messages`, { params: { limit } }),
  editedMessages: (chatId: string, limit = 30) => api.get(`/chats/${chatId}/edited-messages`, { params: { limit } }),
  templates: () => api.get('/chats/templates'),
  createTemplate: (data: { name: string; settings: any }) => api.post('/chats/templates', data),
  applyTemplate: (chatId: string, templateId: number) => api.post(`/chats/${chatId}/templates/${templateId}/apply`),
  deleteTemplate: (templateId: number) => api.delete(`/chats/templates/${templateId}`),
  exportSettings: (chatId: string) => api.get(`/chats/${chatId}/export`),
  importSettings: (chatId: string, data: any) => api.post(`/chats/${chatId}/import`, data),
  leave: (chatId: string) => api.post(`/chats/${chatId}/leave`),
  broadcast: (data: { text: string; parseMode?: string; chatIds?: string[] }) => api.post('/chats/broadcast', data),
  reports: (chatId: string, days = 7) => api.get(`/chats/${chatId}/reports`, { params: { days } }),
};

export const logsApi = {
  list: (params: { limit?: number } = {}) => api.get<Log[]>('/logs', { params }),
  cleanup: (olderThanDays: number) => api.delete('/logs', { data: { olderThanDays } }),
};

export const moderationApi = {
  getSettings: (chatId: string) => api.get<ModerationSettings>(`/moderation/${chatId}/settings`),
  updateSettings: (chatId: string, data: Partial<ModerationSettings>) =>
    api.patch(`/moderation/${chatId}/settings`, data),
  getBlacklist: (chatId: string) => api.get<BlacklistWord[]>(`/moderation/${chatId}/blacklist`),
  addBlacklist: (chatId: string, word: string) =>
    api.post(`/moderation/${chatId}/blacklist`, { word }),
  removeBlacklist: (chatId: string, id: number) =>
    api.delete(`/moderation/${chatId}/blacklist/${id}`),
  getLogs: (chatId: string, limit = 30) =>
    api.get<ModerationLog[]>(`/moderation/${chatId}/logs`, { params: { limit } }),
};

export const articlesApi = {
  list: () => api.get<Article[]>('/articles'),
  get: (slug: string) => api.get<Article>(`/articles/slug/${slug}`),
  create: (data: Partial<Article>) => api.post<Article>('/articles', data),
  update: (id: number, data: Partial<Article>) => api.patch<Article>(`/articles/${id}`, data),
  delete: (id: number) => api.delete(`/articles/${id}`),
};

export const schedulerApi = {
  list: () => api.get<ScheduledPost[]>('/scheduler'),
  create: (data: any) => api.post('/scheduler', data),
};

export const analyticsApi = {
  metrics: (chatId: string, days = 7) =>
    api.get<{ metrics: Record<string, number | string> }>(`/analytics/metrics/${chatId}`, {
      params: { days },
    }),
};

export const auditApi = {
  logs: (params: { limit?: number; page?: number; search?: string; action?: string; sortBy?: string; sortOrder?: string } = {}) =>
    api.get<{ data: AuditLog[]; pagination: { page: number; limit: number; total: number; totalPages: number; hasNext: boolean; hasPrev: boolean } }>('/audit/logs', { params }),
  actions: () => api.get<string[]>('/audit/actions'),
};

export const usersApi = {
  list: () => api.get<any[]>('/moderation/users'),
  create: (data: { username: string; password: string; role?: string }) => api.post('/moderation/users', data),
  updateRole: (id: number, role: string) => api.patch(`/moderation/users/${id}/role`, { role }),
  delete: (id: number) => api.delete(`/moderation/users/${id}`),
};

// === YENİ: Custom Commands API ===
export const commandsApi = {
  list: () => api.get<CustomCommand[]>('/commands'),
  create: (data: { command: string; response: string }) => api.post('/commands', data),
  toggle: (id: number, isActive: boolean) => api.patch(`/commands/${id}/toggle`, { isActive }),
  delete: (id: number) => api.delete(`/commands/${id}`),
};

// === YENİ: Abonelik Yönetimi API ===
export const subscriptionsApi = {
  list: () => api.get<Subscription[]>('/payments/subscriptions'),
  create: (data: { userId: string; chatId?: string; plan?: string; expiresAt?: string }) => api.post('/payments/subscriptions', data),
  delete: (id: number) => api.delete(`/payments/subscriptions/${id}`),
};

// === YENİ: Global Blacklist API ===
export const globalBlacklistApi = {
  list: () => api.get<GlobalBlacklistItem[]>('/moderation/global-blacklist'),
  add: (userId: string, reason?: string) => api.post('/moderation/global-blacklist', { userId, reason }),
  remove: (id: number) => api.delete(`/moderation/global-blacklist/${id}`),
};

// === YENİ: Captcha Sessions API ===
export const captchaApi = {
  list: (chatId: string) => api.get<CaptchaSession[]>(`/moderation/${chatId}/captcha`),
  verify: (id: number) => api.post(`/moderation/captcha/${id}/verify`),
};

// === YENİ: Kullanıcı Profil API ===
export const userProfileApi = {
  get: (userId: string) => api.get<UserProfile>(`/moderation/user/${userId}`),
};

// === YENİ: Webhook Test API ===
export const webhookApi = {
  test: (url: string) => api.post('/moderation/test-webhook', { url }),
};

// === SAAS: Workspace & Plan API ===
export const workspaceApi = {
  getMyWorkspace: () => api.get<any>('/workspace'),
  updateMyWorkspace: (data: any) => api.patch('/workspace', data),
  getStats: () => api.get<any>('/workspace/stats'),
};

export const plansApi = {
  list: () => api.get<any[]>('/plans'),
};

export const adminApi = {
  listWorkspaces: () => api.get<any[]>('/admin/workspaces'),
  getWorkspace: (id: number) => api.get<any>(`/admin/workspaces/${id}`),
  createWorkspace: (data: any) => api.post('/admin/workspaces', data),
  updateWorkspace: (id: number, data: any) => api.patch(`/admin/workspaces/${id}`, data),
  deleteWorkspace: (id: number) => api.delete(`/admin/workspaces/${id}`),
  getStats: () => api.get<any>('/admin/stats'),
};

// Default export for advanced use (rare)
export default api;

// Named exports for consumers (use these everywhere)
export {
  analyticsApi as analytics, articlesApi as articles, auditApi as audit, captchaApi as captcha, chatsApi as chats,
  commandsApi as commands, globalBlacklistApi as globalBlacklist, logsApi as logs,
  moderationApi as moderation, schedulerApi as scheduler,
  subscriptionsApi as subscriptions, userProfileApi as userProfile, webhookApi as webhook
};
