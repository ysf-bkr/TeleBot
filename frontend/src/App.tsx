import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Toaster, toast } from 'sonner';
import { i18n } from './lib/i18n';

// Shared
import { auth as authApi, chats as chatsApi, logs as logsApi, setAuthToken, settings as settingsApi } from './lib/api';
import { BotStatus, Chat, Log, User } from './types';

import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';

// Views
import { AdminPanel } from './pages/admin/AdminPanel';
import { AnalyticsView } from './pages/analytics/AnalyticsView';
import { ArticlesView } from './pages/articles/ArticlesView';
import { AuditLogsView } from './pages/audit/AuditLogsView';
import ForgotPasswordView from './pages/auth/ForgotPasswordView';
import { LoginView } from './pages/auth/LoginView';
import ChatDetailView from './pages/chat/ChatDetailView';
import { GroupsView } from './pages/chat/GroupsView';
import { CommandsView } from './pages/commands/CommandsView';
import { DashboardView } from './pages/dashboard/DashboardView';
import NotFoundView from './pages/errors/NotFoundView';
import LandingView from './pages/landing/LandingView';
import { ActivityView } from './pages/log/ActivityView';
import { GlobalBlacklistView } from './pages/moderation/GlobalBlacklistView';
import { ModerationView } from './pages/moderation/ModerationView';
import { UserProfileView } from './pages/moderation/UserProfileView';
import { WebhookTestView } from './pages/moderation/WebhookTestView';
import OnboardingView from './pages/onboarding/OnboardingView';
import { SubscriptionsView } from './pages/payments/SubscriptionsView';
import { SchedulerView } from './pages/scheduler/SchedulerView';
import { SettingsView } from './pages/settings/SettingsView';
import SetupView from './pages/setup/SetupView';
import { TeamView } from './pages/team/TeamView';

// Panda
import { css } from '../styled-system/css';

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('token') || '');
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(!!token);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [settings, setSettings] = useState<any>(null);
  const [botStatus, setBotStatus] = useState<BotStatus>({ connected: false });
  const [chats, setChats] = useState<Chat[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [botInfo, setBotInfo] = useState<BotStatus | null>(null);
  const [welcomeText, setWelcomeText] = useState('');
  const [welcomeEnabled, setWelcomeEnabled] = useState(true);
  const [parseMode, setParseMode] = useState('HTML');
  const [webhookDomain, setWebhookDomain] = useState('');
  const [newToken, setNewToken] = useState('');
  const [socket, setSocket] = useState<any>(null);
  const [isSetup, setIsSetup] = useState<boolean | null>(null);
  const [, setLangVersion] = useState(0);

  useEffect(() => {
    const unsub = i18n.onChange(() => setLangVersion(v => v + 1));
    return () => { unsub(); };
  }, []);

  useEffect(() => {
    const handleAuthLogout = () => {
      setToken(''); setIsLoggedIn(false); setUser(null); setAuthToken(null);
    };
    window.addEventListener('auth_logout', handleAuthLogout);
    return () => window.removeEventListener('auth_logout', handleAuthLogout);
  }, []);

  useEffect(() => {
    fetch('/api/setup/status')
      .then(res => res.json())
      .then(data => {
        setIsSetup(data.configured);
      })
      .catch(() => {
        setIsSetup(true);
      });
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const handleLogin = async (loginData: any) => {
    try {
      let tokenVal = '';
      let userVal = null;
      if (loginData && loginData.token && loginData.user) {
        tokenVal = loginData.token; userVal = loginData.user;
      } else {
        const res = await authApi.login(loginData);
        tokenVal = res.data.token; userVal = res.data.user;
      }
      localStorage.setItem('token', tokenVal);
      setToken(tokenVal); setUser(userVal); setIsLoggedIn(true);
      setAuthToken(tokenVal);
      toast.success(i18n.t('login.success'));
    } catch (err: any) {
      toast.error(err.response?.data?.error || i18n.t('login.failed'));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token'); setToken(''); setIsLoggedIn(false);
    setUser(null); setAuthToken(null);
    if (socket) socket.disconnect();
    setSocket(null);
    toast.info(i18n.t('logout'));
  };

  const fetchSettings = async () => {
    try {
      const res = await settingsApi.get();
      const data = res.data;
      setSettings(data); setWelcomeText(data.welcomeMessage || '');
      setWelcomeEnabled(data.welcomeEnabled); setParseMode(data.parseMode || 'HTML');
      setWebhookDomain(data.webhookDomain || '');
    } catch (e) { console.error('Settings fetch error'); }
  };

  const fetchChats = async () => { try { const res = await chatsApi.list(); setChats(res.data); } catch (e) {} };
  const fetchLogs = async () => { try { const res = await logsApi.list({ limit: 40 }); setLogs(res.data); } catch (e) {} };

  const fetchBotInfo = async () => {
    try { const res = await settingsApi.getBotInfo(); setBotInfo(res.data); toast.success(i18n.t('bot.info_updated')); }
    catch (e) { toast.error(i18n.t('bot.info_failed')); }
  };

  const saveGlobalSettings = async () => {
    try {
      await settingsApi.update({ welcomeMessage: welcomeText, welcomeEnabled, parseMode, webhookDomain: webhookDomain || null });
      toast.success(i18n.t('settings.saved')); fetchSettings();
    } catch (e) { toast.error(i18n.t('settings.save_failed')); }
  };

  const updateBotToken = async () => {
    if (!newToken?.trim()) { toast.error(i18n.t('settings.token_required')); return; }
    try {
      await settingsApi.setToken(newToken.trim());
      toast.success(i18n.t('settings.token_updated'));
      setNewToken(''); fetchSettings();
    } catch (e: any) { toast.error(e.response?.data?.error || i18n.t('settings.token_failed')); }
  };

  const restartBot = async () => {
    try { await settingsApi.restart(); toast.success(i18n.t('bot.restarting')); setTimeout(() => fetchSettings(), 1500); }
    catch (e) { toast.error(i18n.t('bot.restart_failed')); }
  };

  const updateBotProfile = async (name: string, description: string) => {
    try { await settingsApi.updateProfile({ name, description }); toast.success(i18n.t('bot.profile_updated')); setTimeout(() => fetchBotInfo(), 1000); }
    catch (e: any) { toast.error(e.response?.data?.error || i18n.t('bot.profile_failed')); }
  };

  const toggleChat = async (chatId: string, currentEnabled: boolean) => {
    try { await chatsApi.toggle(chatId, !currentEnabled); fetchChats(); }
    catch (e: any) { toast.error(i18n.t('chats.toggle_failed')); }
  };

  const updateChatSettings = async (chatId: string, payload: any) => {
    try { await chatsApi.update(chatId, payload); fetchChats(); toast.success(i18n.t('chats.settings_saved')); }
    catch (e: any) { toast.error(i18n.t('chats.settings_failed')); }
  };

  useEffect(() => {
    if (!isLoggedIn || !token) return;
    setAuthToken(token);
    const socketUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? `${window.location.protocol}//${window.location.hostname}:3000` : undefined;
    const s = io(socketUrl, { path: '/socket.io' });
    setSocket(s);
    s.on('connect', () => s.emit('request_bot_status'));
    s.on('bot_status', setBotStatus);
    s.on('new_activity', (log: Log) => { setLogs(prev => [log, ...prev].slice(0, 40)); });
    s.on('moderation_log', (log: any) => { toast.error(`${i18n.t('moderation.log_prefix')}: ${log.action} - ${log.reason}`); });
    s.on('settings_updated', fetchSettings);
    s.on('chat_updated', fetchChats);
    fetchSettings(); fetchChats(); fetchLogs();
    return () => { s.disconnect(); };
  }, [isLoggedIn, token]);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isSetup === false && location.pathname !== '/setup') {
      navigate('/setup', { replace: true });
    }
  }, [isSetup, location.pathname, navigate]);

  useEffect(() => { setMobileMenuOpen(false); }, [location.pathname]);
  const goTo = (path: string) => { navigate(path); };

  const showOnboarding = isLoggedIn && !localStorage.getItem('onboarding_done');
  const isSuperAdmin = user?.role === 'super_admin';

  return (
    <>
      <Toaster theme={theme as any} richColors position="bottom-right" />
      <Routes>
        <Route path="/" element={
          isLoggedIn ? (
            showOnboarding ? <Navigate to="/onboarding" replace /> : <Navigate to="/dashboard" replace />
          ) : <LandingView />
        } />
        <Route path="/login" element={isLoggedIn ? <Navigate to="/" replace /> : <LoginView onLogin={handleLogin} />} />
        <Route path="/forgot-password" element={<ForgotPasswordView />} />
        <Route path="/setup" element={<SetupView />} />
        <Route path="/onboarding" element={!isLoggedIn ? <Navigate to="/login" replace /> : <OnboardingView />} />
        <Route path="/404" element={<NotFoundView />} />

        <Route path="/*" element={
          !isLoggedIn ? <Navigate to="/" replace /> : (
            <div className={css({ display: 'flex', flexDirection: 'column', h: '100dvh', bg: 'bgCanvas', overflow: 'hidden' })}>
              <Header user={user} onLogout={handleLogout} onToggleMenu={() => setMobileMenuOpen(!mobileMenuOpen)} isMenuOpen={mobileMenuOpen} theme={theme} onToggleTheme={toggleTheme} />
              <div className={css({ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' })}>
                {mobileMenuOpen && <div onClick={() => setMobileMenuOpen(false)} className={css({ position: 'absolute', inset: 0, bg: 'rgba(9, 13, 22, 0.6)', backdropFilter: 'blur(4px)', zIndex: 40, display: { base: 'block', lg: 'none' } })} />}
                <Sidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} user={user} />
                <main className={css({ flex: 1, overflowY: 'auto', p: { base: '4', md: '6', lg: '8' }, w: 'full' })}>
                  <Routes>
                    <Route path="/dashboard" element={<DashboardView botStatus={botStatus} chats={chats} welcomeEnabled={welcomeEnabled} logs={logs} goTo={goTo} user={user} />} />
                    <Route path="/settings" element={<SettingsView settings={settings} welcomeText={welcomeText} setWelcomeText={setWelcomeText} welcomeEnabled={welcomeEnabled} setWelcomeEnabled={setWelcomeEnabled} parseMode={parseMode} setParseMode={setParseMode} newToken={newToken} setNewToken={setNewToken} onSaveSettings={saveGlobalSettings} onUpdateToken={updateBotToken} onFetchBotInfo={fetchBotInfo} onRestartBot={restartBot} botInfo={botInfo} onUpdateBotProfile={updateBotProfile} />} />
                    <Route path="/chats" element={<GroupsView chats={chats} onRefresh={fetchChats} onToggle={toggleChat} onUpdateChat={updateChatSettings} botStatus={botStatus} />} />
                    <Route path="/chats/:chatId" element={<ChatDetailView />} />
                    <Route path="/logs" element={<ActivityView logs={logs} onRefresh={fetchLogs} />} />
                    <Route path="/moderation" element={<ModerationView chats={chats} onRefreshChats={fetchChats} />} />
                    <Route path="/scheduler" element={<SchedulerView chats={chats} />} />
                    <Route path="/articles" element={<ArticlesView />} />
                    <Route path="/analytics" element={<AnalyticsView chats={chats} />} />
                    <Route path="/team" element={<TeamView />} />
                    <Route path="/commands" element={<CommandsView />} />
                    <Route path="/audit" element={<AuditLogsView />} />
                    <Route path="/global-blacklist" element={<GlobalBlacklistView />} />
                    <Route path="/subscriptions" element={<SubscriptionsView />} />
                    <Route path="/user-profile" element={<UserProfileView />} />
                    <Route path="/webhook-test" element={<WebhookTestView />} />
                    {isSuperAdmin && <Route path="/admin" element={<AdminPanel />} />}
                    <Route path="*" element={<NotFoundView />} />
                  </Routes>
                </main>
              </div>
            </div>
          )
        } />
      </Routes>
    </>
  );
}

export default App;
