# 🤖 Telegram Bot Yönetim Paneli

**Güçlü, modern ve kapsamlı bir Telegram bot yönetim paneli.** Birden çok grubu, moderasyonu, zamanlanmış mesajları, abonelikleri ve çok daha fazlasını tek bir arayüzden yönetin.

![Version](https://img.shields.io/badge/version-2.1-red)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)
![Fastify](https://img.shields.io/badge/Fastify-5-lightgrey)
![React](https://img.shields.io/badge/React-19-61DAFB)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 📸 Ekran Görüntüleri

| Dashboard | Grup Analitiği | Moderasyon |
|-----------|---------------|------------|
| ![Dashboard](https://placehold.co/400x250/1a1a2e/e74c3c?text=Dashboard) | ![Analytics](https://placehold.co/400x250/1a1a2e/3498db?text=Analytics) | ![Moderation](https://placehold.co/400x250/1a1a2e/2ecc71?text=Moderation) |

---

## ✨ Özellikler

### 🤖 Çoklu Bot Desteği
- Birden çok Telegram botunu tek panelden yönetin
- Webhook ve polling modu desteği
- Bot profili (ad, açıklama) güncelleme

### 💬 Grup Yönetimi
- Tüm grupları görüntüleme ve yönetme
- Hoş geldin mesajları (global ve grup bazlı)
- Grup adı, açıklaması, fotoğrafı güncelleme
- **Mesaj Geçmişi** - Son 50 mesajı görüntüleme
- **Üye Listesi** - Yöneticileri ve üyeleri görüntüleme
- **Yönetici Yönetimi** - Yönetici atama/yetkisini alma
- **Otomatik Yanıtlayıcı** - Tetikleyici kelimelere otomatik yanıt
- **Silinen/Düzenlenen Mesajlar** - Geçmiş kayıtları
- **Export/Import** - Grup ayarlarını JSON yedekleme
- **Gruptan Ayrılma** - Botu gruptan çıkarma

### 🛡️ Gelişmiş Moderasyon
- Yasaklı kelime filtresi (kara liste)
- Otomatik spam koruması
- Uyarı → At/Yasakla/Sustur sistemi
- **CAPTCHA Koruması** - Yeni üyeler için bot doğrulaması
- **Global Kara Liste** - Tüm botlarda geçerli spammer engelleme
- **Gemini AI Moderasyon** (opsiyonel)
- Link silme, küfür engelleme

### 📅 Mesaj Planlayıcı (Scheduler)
- Zamanlanmış mesaj gönderimi
- Tekrarlı yayın (günlük, haftalık, aylık)
- Otomatik mesaj silme
- Buton destekli mesajlar

### 📊 Analitik ve Raporlar
- Her grup için ayrı metrikler
- En aktif kullanıcılar
- Moderasyon istatistikleri
- Günlük/haftalık/aylık görünüm
- Chart.js ile görsel grafikler

### 📋 Denetim ve Güvenlik
- **Denetim Kayıtları** - Tüm API çağrıları loglanır
- Sayfalama, arama, filtreleme, sıralama
- JWT tabanlı kimlik doğrulama
- RBAC (Admin/Moderatör/Kullanıcı rolleri)

### 💳 Abonelik Yönetimi
- Kullanıcı abonelikleri oluşturma ve yönetme
- Aylık, yıllık, ömür boyu planlar
- Stripe webhook entegrasyonu

### 🔧 Ek Özellikler
- 📟 **Özel Komutlar** - Bot için özel `/komut` tanımlama
- 📄 **Sayfalar (Articles)** - Telegraph benzeri makale sistemi
- 🌐 **Webhook Test** - Harici URL'leri test etme
- 👤 **Kullanıcı Profil Kartı** - Kullanıcı aktivite geçmişi
- 📢 **Toplu Mesaj (Broadcast)** - Tüm gruplara anlık duyuru
- 📋 **Grup Şablonları** - Ayarları şablon olarak kaydetme
- 🌓 **Karanlık/Aydınlık Tema**
- 🇹🇷 **Türkçe / 🇬🇧 İngilizce dil desteği** (i18n)
- 📱 **Tam Mobil Uyumlu**

---

## 🚀 Hızlı Başlangıç

### Gereksinimler
- Node.js 18+
- npm 9+
- Telegram Bot Token ([@BotFather](https://t.me/BotFather))

### Kurulum

```bash
# Repoyu klonla
git clone https://github.com/kullanici/telegram-bot-panel.git
cd telegram-bot-panel

# Bağımlılıkları yükle
npm run install:all

# Backend yapılandırması
cp backend/.env.example backend/.env
# .env dosyasını düzenleyin:
# TELEGRAM_BOT_TOKEN=your_bot_token
# ADMIN_EMAIL=admin@example.com
# ADMIN_PASSWORD=your_password
# JWT_SECRET=your_jwt_secret

# Geliştirme sunucusunu başlat
npm run dev
```

### Ortam Değişkenleri (.env)

| Değişken | Açıklama | Varsayılan |
|----------|----------|-----------|
| `TELEGRAM_BOT_TOKEN` | Bot token | – |
| `TELEGRAM_BOT_USERNAME` | Bot kullanıcı adı (opsiyonel) | – |
| `ADMIN_EMAIL` | Admin giriş e-postası | `admin@admin.com` |
| `ADMIN_PASSWORD` | Admin şifresi | `admin123` |
| `JWT_SECRET` | JWT imza anahtarı | `dev_fallback` |
| `PORT` | Sunucu portu | `3000` |
| `CORS_ORIGIN` | CORS izin verilen origin | `*` |
| `LOG_LEVEL` | Log seviyesi | `info` |

---

## 📂 Proje Yapısı

```
telegram-bot-panel/
├── backend/                     # Backend (Fastify + TypeScript)
│   ├── src/
│   │   ├── index.ts             # Sunucu başlangıcı
│   │   ├── db/                  # Veritabanı (SQLite + Kysely)
│   │   │   ├── index.ts         # DB bağlantısı
│   │   │   └── migrations.ts    # Tablo oluşturma
│   │   ├── modules/             # Modüller (12 adet)
│   │   │   ├── auth/            # JWT, Telegram, Email giriş
│   │   │   ├── chat/            # Grup yönetimi + özellikler
│   │   │   ├── moderation/      # Moderasyon, CAPTCHA, RBAC
│   │   │   ├── scheduler/       # Zamanlanmış gönderiler
│   │   │   ├── analytics/       # Metrikler ve grafikler
│   │   │   ├── articles/        # Makale sistemi
│   │   │   ├── audit/           # Denetim kayıtları
│   │   │   ├── commands/        # Özel komutlar
│   │   │   ├── log/             # Aktivite logları
│   │   │   ├── payments/        # Abonelik yönetimi
│   │   │   ├── settings/        # Sistem ayarları
│   │   │   └── └── ...
│   │   ├── services/            # Servisler (bot.service.ts)
│   │   ├── plugins/             # Fastify plugin (auth)
│   │   ├── routes/              # Webhook route
│   │   ├── websocket/           # Socket.io
│   │   └── types/               # TypeScript tipleri
│   └── package.json
│
├── frontend/                    # Frontend (React + Panda CSS)
│   ├── src/
│   │   ├── App.tsx              # Ana uygulama + routing
│   │   ├── lib/
│   │   │   ├── api.ts           # Axios API (75+ endpoint)
│   │   │   └── i18n.ts          # Çoklu dil (TR/EN)
│   │   ├── components/
│   │   │   ├── layout/          # Header, Sidebar
│   │   │   └── ui/              # Button, Card, Modal, vb.
│   │   ├── pages/               # Sayfalar (17 adet)
│   │   │   ├── analytics/       # Grup analitiği
│   │   │   ├── articles/        # Sayfalar
│   │   │   ├── audit/           # Denetim kayıtları
│   │   │   ├── auth/            # Giriş, şifre sıfırlama
│   │   │   ├── chat/            # Gruplar, detay, şablonlar
│   │   │   ├── commands/        # Özel komutlar
│   │   │   ├── dashboard/       # Ana sayfa
│   │   │   ├── log/             # Canlı aktivite
│   │   │   ├── moderation/      # Moderasyon, global bl, profil
│   │   │   ├── payments/        # Abonelikler
│   │   │   ├── scheduler/       # Mesaj planlayıcı
│   │   │   ├── settings/        # Sistem ayarları
│   │   │   ├── team/            # Yönetici ekibi
│   │   │   └── ...
│   │   └── types/               # TypeScript tipleri
│   └── package.json
│
└── package.json                 # Ana paket (monorepo)
```

---

## 🛣️ API Route'ları

### Auth
| Metot | Route | Açıklama |
|-------|-------|----------|
| POST | `/api/auth/login` | Telegram ile giriş |
| POST | `/api/auth/login-email` | E-posta ile giriş |
| POST | `/api/auth/register` | Kayıt |
| POST | `/api/auth/forgot-password` | Şifre sıfırlama |
| GET | `/api/auth/config` | Bot yapılandırması |

### Chats
| Metot | Route | Açıklama |
|-------|-------|----------|
| GET | `/api/chats` | Grup listesi |
| GET | `/api/chats/:id` | Grup detayı |
| GET | `/api/chats/:id/messages` | Mesaj geçmişi |
| GET | `/api/chats/:id/members` | Üye listesi |
| GET | `/api/chats/:id/admins` | Yöneticiler |
| GET | `/api/chats/:id/auto-replies` | Otomatik yanıtlar |
| GET | `/api/chats/:id/deleted-messages` | Silinen mesajlar |
| GET | `/api/chats/:id/edited-messages` | Düzenlenen mesajlar |
| GET | `/api/chats/:id/reports` | Raporlar |
| GET | `/api/chats/:id/export` | Ayarları dışa aktar |
| POST | `/api/chats/:id/import` | Ayarları içe aktar |
| POST | `/api/chats/broadcast` | Toplu mesaj |

### Moderation
| Metot | Route | Açıklama |
|-------|-------|----------|
| GET | `/api/moderation/:id/settings` | Moderasyon ayarları |
| GET | `/api/moderation/:id/blacklist` | Kara liste |
| GET | `/api/moderation/:id/logs` | İhlal logları |
| GET | `/api/moderation/:id/captcha` | CAPTCHA oturumları |
| GET | `/api/moderation/global-blacklist` | Global kara liste |
| GET | `/api/moderation/user/:id/profile` | Kullanıcı profili |
| POST | `/api/moderation/test-webhook` | Webhook test |

### Diğer Modüller
- `GET/POST /api/scheduler` - Mesaj planlayıcı
- `GET/POST/PATCH/DELETE /api/articles` - Sayfalar
- `GET/POST/DELETE /api/commands` - Özel komutlar
- `GET/POST/DELETE /api/payments/subscriptions` - Abonelikler
- `GET /api/audit/logs` - Denetim kayıtları (pagination, search, filter)

---

## 🛠️ Kullanılan Teknolojiler

### Backend
- **Fastify 5** - Hızlı, düşük overhead'li Node.js framework
- **TypeScript 5** - Tip güvenliği
- **SQLite + Kysely** - Hafif, embedded veritabanı
- **Telegraf** - Telegram Bot API
- **Socket.io** - Gerçek zamanlı iletişim
- **JWT (jsonwebtoken)** - Kimlik doğrulama
- **bcryptjs** - Şifre hashleme

### Frontend
- **React 19** - UI kütüphanesi
- **Panda CSS** - CSS-in-JS framework
- **React Router v7** - Sayfa yönlendirme
- **Chart.js** - Grafik ve metrikler
- **Axios** - HTTP istemcisi
- **Socket.io Client** - Gerçek zamanlı
- **Lucide React** - İkon seti
- **Sonner** - Toast bildirimleri

---

## 📊 Frontend Sayfaları

| Sayfa | Route | Açıklama |
|-------|-------|----------|
| Gösterge Paneli | `/dashboard` | Bot durumu, istatistikler, son aktiviteler |
| Sistem Ayarları | `/settings` | Bot token, profil, hoş geldin mesajı |
| Telegram Grupları | `/chats` | Grup listesi, toggle, özel mesaj |
| Grup Detayı | `/chats/:id` | Mesajlar, üyeler, yöneticiler, raporlar |
| Gelişmiş Moderasyon | `/moderation` | Ayarlar, CAPTCHA, global bl, profiller |
| Mesaj Planlayıcı | `/scheduler` | Zamanlanmış gönderiler |
| Sayfalar | `/articles` | Makale CRUD |
| Grup Analitiği | `/analytics` | Her grup için ayrı metrikler |
| Canlı Aktivite | `/logs` | Gerçek zamanlı aktivite akışı |
| Denetim Kayıtları | `/audit` | API logları, arama, filtreleme |
| Özel Komutlar | `/commands` | Bot için özel /komutlar |
| Abonelikler | `/subscriptions` | Kullanıcı abonelikleri |
| Global Kara Liste | `/global-blacklist` | Spammer yönetimi |
| Kullanıcı Profili | `/user-profile` | Kullanıcı sorgulama |
| Webhook Test | `/webhook-test` | URL test aracı |
| Yönetici Ekibi | `/team` | Kullanıcı rolleri |

---

## 🔄 Geliştirme

```bash
# Geliştirme modu (backend + frontend concurrently)
npm run dev

# Sadece backend
npm run dev:backend

# Sadece frontend
npm run dev:frontend

# TypeScript kontrolü
npm run typecheck

# Build
npm run build
```

---

## 🐳 Docker Deployment

```bash
# Build
docker build -t telegram-bot-panel .

# Run
docker run -p 3000:3000 \
  -e TELEGRAM_BOT_TOKEN=your_token \
  -e ADMIN_EMAIL=admin@example.com \
  -e ADMIN_PASSWORD=your_password \
  telegram-bot-panel
```

---

## 🤝 Katkıda Bulunma

1. Fork'layın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit'leyin (`git commit -m 'feat: add amazing feature'`)
4. Branch'inizi push'layın (`git push origin feature/amazing-feature`)
5. Pull Request açın

---

## 📄 Lisans

MIT License - Detaylar için [LICENSE](LICENSE) dosyasına bakın.

---

## 📞 İletişim

- GitHub: [github.com/kullanici/telegram-bot-panel](https://github.com/kullanici/telegram-bot-panel)
- Telegram: [@username](https://t.me/username)

---

> **Not:** Bu proje [@BotFather](https://t.me/BotFather) ile oluşturulan bot token'ları ile çalışır. Botunuzu grubunuza ekleyip yönetici yapmayı unutmayın.
