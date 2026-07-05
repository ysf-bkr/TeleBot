// Simple i18n system for Turkish/English support

export type Language = 'tr' | 'en';

const translations: Record<Language, Record<string, string>> = {
  tr: {
    // Genel
    'app.name': 'Telegram Bot Yönetim Paneli',
    'loading': 'Yükleniyor...',
    'save': 'Kaydet',
    'cancel': 'İptal',
    'delete': 'Sil',
    'search': 'Ara',
    'clear': 'Temizle',
    'filter': 'Filtrele',
    'no_data': 'Veri bulunamadı',
    'yes': 'Evet',
    'no': 'Hayır',
    'confirm': 'Onayla',
    'back': 'Geri',
    'next': 'Sonraki',
    'previous': 'Önceki',
    'total': 'Toplam',
    'records': 'kayıt',
    'online': 'Çevrimiçi',
    'login.success': 'Giriş başarılı',
    'login.failed': 'Giriş başarısız',
    'logout': 'Çıkış yapıldı',
    'bot.info_updated': 'Bot bilgileri güncellendi',
    'bot.info_failed': 'Bot bilgisi alınamadı. Token geçerli mi?',
    'bot.restarting': 'Bot yeniden başlatılıyor...',
    'bot.restart_failed': 'Bot yeniden başlatılamadı',
    'bot.profile_updated': 'Bot bilgileri güncellendi',
    'bot.profile_failed': 'Bot bilgileri güncellenemedi',
    'settings.saved': 'Ayarlar kaydedildi',
    'settings.save_failed': 'Ayarlar kaydedilemedi',
    'settings.token_required': 'Token giriniz',
    'settings.token_failed': 'Token güncellenemedi',
    'chats.toggle_failed': 'Grup durumu değiştirilemedi',
    'chats.settings_saved': 'Grup ayarları güncellendi',
    'chats.settings_failed': 'Grup ayarları kaydedilemedi',
    'moderation.log_prefix': 'Moderasyon',

    // Dashboard
    'dashboard.title': 'Gösterge Paneli',
    'dashboard.subtitle': 'Bot durumu ve son aktiviteler',
    'dashboard.bot_status': 'Bot Durumu',
    'dashboard.connected': 'Bağlı',
    'dashboard.disconnected': 'Bağlı Değil',
    'dashboard.total_chats': 'Toplam Grup',
    'dashboard.active_chats': 'Aktif Grup',
    'dashboard.recent_activity': 'Son Aktiviteler',
    'dashboard.quick_actions': 'Hızlı İşlemler',

    // Settings
    'settings.title': 'Sistem Ayarları',
    'settings.bot_token': 'Bot Token',
    'settings.welcome_message': 'Hoş Geldin Mesajı',
    'settings.welcome_enabled': 'Hoş Geldin Mesajı Aktif',
    'settings.parse_mode': 'Yazı Biçimi',
    'settings.webhook_domain': 'Webhook Domain',
    'settings.save': 'Ayarları Kaydet',
    'settings.token_updated': 'Token güncellendi. Bot yeniden başlatılıyor...',

    // Chats
    'chats.title': 'Telegram Grupları',
    'chats.no_chats': 'Henüz grup eklenmemiş',
    'chats.toggle': 'Aktif/Pasif',
    'chats.member_count': 'Üye Sayısı',
    'chats.last_activity': 'Son Aktivite',

    // Moderation
    'moderation.title': 'Gelişmiş Moderasyon',
    'moderation.subtitle': 'Otomatik filtreler, kara liste, CAPTCHA, kullanıcı yönetimi',
    'moderation.settings': 'Ayarlar',
    'moderation.captcha': 'CAPTCHA',
    'moderation.global_blacklist': 'Global Kara Liste',
    'moderation.user_profile': 'Kullanıcı Profili',
    'moderation.webhook_test': 'Webhook Test',
    'moderation.user_roles': 'Kullanıcı Rolleri',
    'moderation.blacklist': 'Kara Liste',
    'moderation.blacklist_empty': 'Henüz yasaklı kelime yok.',
    'moderation.blacklist_add': 'Kelime Ekle',
    'moderation.blacklist_placeholder': 'Yeni kelime / regex',
    'moderation.blacklist_confirm': 'Yasaklı kelimeyi silmek istediğinize emin misiniz?',
    'moderation.word_added': 'Kelime kara listeye eklendi',
    'moderation.word_removed': 'Kelime kara listeden kaldırıldı',
    'moderation.settings_saved': 'Moderasyon ayarları kaydedildi',
    'moderation.enabled': 'Moderasyon aktif',
    'moderation.rules': 'Topluluk Kuralları',
    'moderation.delete_bad_words': 'Yasaklı kelimeleri sil',
    'moderation.delete_links': 'Linkleri sil',
    'moderation.auto_warn': 'Otomatik uyarı',
    'moderation.max_warnings': 'Maks. Uyarı',
    'moderation.spam_threshold': 'Spam Eşiği',
    'moderation.action_after': 'Uyarı sonrası işlem',
    'moderation.captcha_enabled': 'CAPTCHA Koruması',
    'moderation.ai_moderation': 'Gemini AI Moderasyonu',

    // Commands
    'commands.title': 'Özel Komutlar',
    'commands.subtitle': 'Telegram botunuz için özel /komutlar tanımlayın',
    'commands.add': 'Yeni Komut',
    'commands.name': 'Komut (slashesiz)',
    'commands.response': 'Yanıt Mesajı',
    'commands.create': 'Komutu Oluştur',
    'commands.empty': 'Henüz komut eklenmemiş',
    'commands.empty_desc': 'Botunuza özel komutlar ekleyerek otomatik yanıtlar oluşturun.',
    'commands.active': 'Aktif',
    'commands.passive': 'Pasif',

    // Audit
    'audit.title': 'Denetim Kayıtları',
    'audit.subtitle': 'Tüm API çağrılarını ve yönetici işlemlerini görüntüleyin',
    'audit.search_placeholder': 'Ara: aksiyon, kullanıcı, IP, detay...',
    'audit.action_filter': 'Aksiyon Türü',
    'audit.sort': 'Sıralama',
    'audit.sort_date': 'Tarih',
    'audit.sort_action': 'Aksiyon',
    'audit.sort_user': 'Kullanıcı',
    'audit.no_results': 'Aramanızla eşleşen kayıt bulunamadı',
    'audit.no_records': 'Henüz denetim kaydı bulunmuyor',

    // Subscriptions
    'subscriptions.title': 'Abonelik Yönetimi',
    'subscriptions.subtitle': 'Kullanıcı aboneliklerini görüntüleyin ve yönetin',
    'subscriptions.add': 'Yeni Abonelik',
    'subscriptions.user_id': 'Kullanıcı ID',
    'subscriptions.plan': 'Plan',
    'subscriptions.monthly': 'Aylık',
    'subscriptions.yearly': 'Yıllık',
    'subscriptions.lifetime': 'Ömür Boyu',
    'subscriptions.expires': 'Bitiş Tarihi',
    'subscriptions.empty': 'Henüz abonelik bulunmuyor',
    'subscriptions.empty_desc': 'Kullanıcılar için abonelik oluşturarak premium özellikleri yönetin.',
    'subscriptions.create': 'Aboneliği Oluştur',
    'subscriptions.delete_confirm': 'Bu aboneliği iptal etmek istediğinize emin misiniz?',

    // Global Blacklist
    'global_bl.title': 'Global Kara Liste',
    'global_bl.subtitle': 'Tüm botlarda ve gruplarda geçerli olacak spammer kullanıcıları yönetin',
    'global_bl.add': 'Kullanıcı Ekle',
    'global_bl.user_id': 'Kullanıcı ID (Telegram ID)',
    'global_bl.reason': 'Sebep (opsiyonel)',
    'global_bl.search_placeholder': 'Kullanıcı ID veya sebep ile ara...',
    'global_bl.empty': 'Global kara liste boş',
    'global_bl.empty_desc': 'Spammer kullanıcıları buradan tüm botlara karşı engelleyin.',
    'global_bl.added': 'Kullanıcı global kara listeye eklendi',
    'global_bl.removed': 'Kullanıcı kara listeden çıkarıldı',
    'global_bl.remove_confirm': 'Bu kullanıcıyı kara listeden çıkarmak istediğinize emin misiniz?',
    'global_bl.blocked': 'Engelli',
    'global_bl.clean': 'Temiz',

    // User Profile
    'profile.title': 'Kullanıcı Profil Kartı',
    'profile.subtitle': 'Telegram kullanıcılarının tüm aktivitelerini ve moderasyon geçmişini görüntüleyin',
    'profile.search_placeholder': 'Telegram Kullanıcı ID\'si girin (örn: 123456789)',
    'profile.search': 'Ara',
    'profile.not_found': 'Kullanıcı bulunamadı',
    'profile.not_found_desc': 'Geçerli bir Telegram kullanıcı ID\'si girdiğinizden emin olun.',
    'profile.total_messages': 'Toplam Mesaj',
    'profile.joins': 'Katılma',
    'profile.moderation': 'Moderasyon',
    'profile.blacklist_status': 'Kara Liste',
    'profile.last_seen': 'Son görülme',
    'profile.moderation_history': 'Moderasyon Geçmişi',
    'profile.recent_activity': 'Son Aktiviteler',
    'profile.global_blacklisted': 'Global Kara Listede',

    // Webhook Test
    'webhook.title': 'Webhook Test',
    'webhook.subtitle': 'Harici webhook URL\'lerinizi test edin ve yanıt sürelerini görüntüleyin',
    'webhook.url': 'Webhook URL',
    'webhook.test': 'Test Et',
    'webhook.testing': 'Test Ediliyor...',
    'webhook.result': 'Test Sonucu',
    'webhook.status': 'Durum',
    'webhook.success': 'Başarılı',
    'webhook.failed': 'Başarısız',
    'webhook.http_code': 'HTTP Kodu',
    'webhook.duration': 'Yanıt Süresi',
    'webhook.response': 'Yanıt İçeriği',
    'webhook.info': 'Test sırasında URL\'e bir POST isteği gönderilir. Webhook\'unuzun doğru çalıştığından emin olmak için kullanabilirsiniz.',

    // Scheduler
    'scheduler.title': 'Mesaj Planlayıcı',
    'scheduler.add': 'Yeni Gönderi',
    'scheduler.content': 'Mesaj İçeriği',
    'scheduler.schedule': 'Zamanla',
    'scheduler.repeat': 'Tekrar',
    'scheduler.none': 'Tekrarsız',
    'scheduler.daily': 'Günlük',
    'scheduler.weekly': 'Haftalık',
    'scheduler.monthly': 'Aylık',

    // Articles
    'articles.title': 'Sayfalar',
    'articles.add': 'Yeni Sayfa',
    'articles.slug': 'Sayfa URL\'si',
    'articles.title_field': 'Başlık',

    // Analytics
    'analytics.title': 'Grup Analitiği',
    'analytics.messages': 'Mesaj',
    'analytics.joins': 'Katılma',
    'analytics.leaves': 'Ayrılma',
    'analytics.days': 'gün',

    // Team
    'team.title': 'Yönetici Ekibi',
    'team.add_user': 'Kullanıcı Ekle',
    'team.username': 'Kullanıcı Adı',
    'team.password': 'Şifre',
    'team.role': 'Rol',
    'team.admin': 'Admin',
    'team.moderator': 'Moderatör',

    // Errors
    'error.401': 'Oturum süresi doldu. Lütfen tekrar giriş yapın.',
    'error.500': 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.',
    'error.not_found': 'Sayfa bulunamadı',
    'error.not_found_desc': 'Aradığınız sayfa mevcut değil.',
  },

  en: {
    // General
    'app.name': 'Telegram Bot Management Panel',
    'loading': 'Loading...',
    'save': 'Save',
    'cancel': 'Cancel',
    'delete': 'Delete',
    'search': 'Search',
    'clear': 'Clear',
    'filter': 'Filter',
    'no_data': 'No data found',
    'yes': 'Yes',
    'no': 'No',
    'confirm': 'Confirm',
    'back': 'Back',
    'next': 'Next',
    'previous': 'Previous',
    'total': 'Total',
    'records': 'records',
    'online': 'Online',
    'login.success': 'Login successful',
    'login.failed': 'Login failed',
    'logout': 'Logged out',
    'bot.info_updated': 'Bot info updated',
    'bot.info_failed': 'Could not get bot info. Is the token valid?',
    'bot.restarting': 'Restarting bot...',
    'bot.restart_failed': 'Could not restart bot',
    'bot.profile_updated': 'Bot profile updated',
    'bot.profile_failed': 'Could not update bot profile',
    'settings.saved': 'Settings saved',
    'settings.save_failed': 'Could not save settings',
    'settings.token_required': 'Please enter a token',
    'settings.token_failed': 'Could not update token',
    'chats.toggle_failed': 'Could not toggle chat',
    'chats.settings_saved': 'Chat settings updated',
    'chats.settings_failed': 'Could not save chat settings',
    'moderation.log_prefix': 'Moderation',

    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.subtitle': 'Bot status and recent activities',
    'dashboard.bot_status': 'Bot Status',
    'dashboard.connected': 'Connected',
    'dashboard.disconnected': 'Disconnected',
    'dashboard.total_chats': 'Total Groups',
    'dashboard.active_chats': 'Active Groups',
    'dashboard.recent_activity': 'Recent Activities',
    'dashboard.quick_actions': 'Quick Actions',

    // Settings
    'settings.title': 'System Settings',
    'settings.bot_token': 'Bot Token',
    'settings.welcome_message': 'Welcome Message',
    'settings.welcome_enabled': 'Welcome Message Enabled',
    'settings.parse_mode': 'Parse Mode',
    'settings.webhook_domain': 'Webhook Domain',
    'settings.save': 'Save Settings',
    'settings.token_updated': 'Token updated. Restarting bot...',

    // Chats
    'chats.title': 'Telegram Groups',
    'chats.no_chats': 'No groups added yet',
    'chats.toggle': 'Enable/Disable',
    'chats.member_count': 'Members',
    'chats.last_activity': 'Last Activity',

    // Moderation
    'moderation.title': 'Advanced Moderation',
    'moderation.subtitle': 'Auto filters, blacklist, CAPTCHA, user management',
    'moderation.settings': 'Settings',
    'moderation.captcha': 'CAPTCHA',
    'moderation.global_blacklist': 'Global Blacklist',
    'moderation.user_profile': 'User Profile',
    'moderation.webhook_test': 'Webhook Test',
    'moderation.user_roles': 'User Roles',
    'moderation.blacklist': 'Blacklist',
    'moderation.blacklist_empty': 'No banned words yet.',
    'moderation.blacklist_add': 'Add Word',
    'moderation.blacklist_placeholder': 'New word / regex',
    'moderation.blacklist_confirm': 'Are you sure you want to delete this banned word?',
    'moderation.word_added': 'Word added to blacklist',
    'moderation.word_removed': 'Word removed from blacklist',
    'moderation.settings_saved': 'Moderation settings saved',
    'moderation.enabled': 'Moderation enabled',
    'moderation.rules': 'Community Rules',
    'moderation.delete_bad_words': 'Delete bad words',
    'moderation.delete_links': 'Delete links',
    'moderation.auto_warn': 'Auto warn',
    'moderation.max_warnings': 'Max Warnings',
    'moderation.spam_threshold': 'Spam Threshold',
    'moderation.action_after': 'Action after warnings',
    'moderation.captcha_enabled': 'CAPTCHA Protection',
    'moderation.ai_moderation': 'Gemini AI Moderation',

    // Commands
    'commands.title': 'Custom Commands',
    'commands.subtitle': 'Define custom /commands for your Telegram bot',
    'commands.add': 'New Command',
    'commands.name': 'Command (without slash)',
    'commands.response': 'Response Message',
    'commands.create': 'Create Command',
    'commands.empty': 'No commands added yet',
    'commands.empty_desc': 'Add custom commands to create automated responses.',
    'commands.active': 'Active',
    'commands.passive': 'Inactive',

    // Audit
    'audit.title': 'Audit Records',
    'audit.subtitle': 'View all API calls and admin operations',
    'audit.search_placeholder': 'Search: action, user, IP, details...',
    'audit.action_filter': 'Action Type',
    'audit.sort': 'Sort',
    'audit.sort_date': 'Date',
    'audit.sort_action': 'Action',
    'audit.sort_user': 'User',
    'audit.no_results': 'No records match your search',
    'audit.no_records': 'No audit records yet',

    // Subscriptions
    'subscriptions.title': 'Subscription Management',
    'subscriptions.subtitle': 'View and manage user subscriptions',
    'subscriptions.add': 'New Subscription',
    'subscriptions.user_id': 'User ID',
    'subscriptions.plan': 'Plan',
    'subscriptions.monthly': 'Monthly',
    'subscriptions.yearly': 'Yearly',
    'subscriptions.lifetime': 'Lifetime',
    'subscriptions.expires': 'Expiry Date',
    'subscriptions.empty': 'No subscriptions yet',
    'subscriptions.empty_desc': 'Create subscriptions to manage premium features.',
    'subscriptions.create': 'Create Subscription',
    'subscriptions.delete_confirm': 'Are you sure you want to cancel this subscription?',

    // Global Blacklist
    'global_bl.title': 'Global Blacklist',
    'global_bl.subtitle': 'Manage spammer users across all bots and groups',
    'global_bl.add': 'Add User',
    'global_bl.user_id': 'User ID (Telegram ID)',
    'global_bl.reason': 'Reason (optional)',
    'global_bl.search_placeholder': 'Search by user ID or reason...',
    'global_bl.empty': 'Global blacklist is empty',
    'global_bl.empty_desc': 'Block spammer users across all bots from here.',
    'global_bl.added': 'User added to global blacklist',
    'global_bl.removed': 'User removed from blacklist',
    'global_bl.remove_confirm': 'Are you sure you want to remove this user from blacklist?',
    'global_bl.blocked': 'Blocked',
    'global_bl.clean': 'Clean',

    // User Profile
    'profile.title': 'User Profile Card',
    'profile.subtitle': 'View all activities and moderation history of Telegram users',
    'profile.search_placeholder': 'Enter Telegram User ID (e.g: 123456789)',
    'profile.search': 'Search',
    'profile.not_found': 'User not found',
    'profile.not_found_desc': 'Make sure you entered a valid Telegram user ID.',
    'profile.total_messages': 'Total Messages',
    'profile.joins': 'Joins',
    'profile.moderation': 'Moderation',
    'profile.blacklist_status': 'Blacklist',
    'profile.last_seen': 'Last seen',
    'profile.moderation_history': 'Moderation History',
    'profile.recent_activity': 'Recent Activities',
    'profile.global_blacklisted': 'Global Blacklisted',

    // Webhook Test
    'webhook.title': 'Webhook Test',
    'webhook.subtitle': 'Test external webhook URLs and view response times',
    'webhook.url': 'Webhook URL',
    'webhook.test': 'Test',
    'webhook.testing': 'Testing...',
    'webhook.result': 'Test Result',
    'webhook.status': 'Status',
    'webhook.success': 'Successful',
    'webhook.failed': 'Failed',
    'webhook.http_code': 'HTTP Code',
    'webhook.duration': 'Response Time',
    'webhook.response': 'Response Body',
    'webhook.info': 'A POST request is sent to the URL during the test. Use this to verify your webhook is working correctly.',

    // Scheduler
    'scheduler.title': 'Message Scheduler',
    'scheduler.add': 'New Post',
    'scheduler.content': 'Message Content',
    'scheduler.schedule': 'Schedule',
    'scheduler.repeat': 'Repeat',
    'scheduler.none': 'No Repeat',
    'scheduler.daily': 'Daily',
    'scheduler.weekly': 'Weekly',
    'scheduler.monthly': 'Monthly',

    // Articles
    'articles.title': 'Pages',
    'articles.add': 'New Page',
    'articles.slug': 'Page URL',
    'articles.title_field': 'Title',

    // Analytics
    'analytics.title': 'Group Analytics',
    'analytics.messages': 'Messages',
    'analytics.joins': 'Joins',
    'analytics.leaves': 'Leaves',
    'analytics.days': 'days',

    // Team
    'team.title': 'Admin Team',
    'team.add_user': 'Add User',
    'team.username': 'Username',
    'team.password': 'Password',
    'team.role': 'Role',
    'team.admin': 'Admin',
    'team.moderator': 'Moderator',

    // Errors
    'error.401': 'Session expired. Please login again.',
    'error.500': 'Server error. Please try again later.',
    'error.not_found': 'Page not found',
    'error.not_found_desc': 'The page you are looking for does not exist.',
  }
};

class I18n {
  private currentLang: Language;
  private listeners: Set<() => void> = new Set();

  constructor() {
    const saved = localStorage.getItem('lang') as Language | null;
    this.currentLang = saved && ['tr', 'en'].includes(saved) ? saved : 'tr';
  }

  get lang(): Language {
    return this.currentLang;
  }

  set lang(l: Language) {
    this.currentLang = l;
    localStorage.setItem('lang', l);
    this.listeners.forEach(fn => fn());
    document.documentElement.lang = l;
  }

  t(key: string, params?: Record<string, string | number>): string {
    const text = translations[this.currentLang]?.[key] || translations.tr[key] || key;
    if (!params) return text;
    return text.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? `{${k}}`));
  }

  onChange(fn: () => void) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  toggle() {
    this.lang = this.currentLang === 'tr' ? 'en' : 'tr';
  }
}

export const i18n = new I18n();
export default i18n;
