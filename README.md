# 🤖 TeleBot - Telegram Bot Yönetim Paneli (SaaS)

**Güçlü, modern ve kapsamlı bir SaaS Telegram bot yönetim paneli.** Multi-tenant mimarisi ile birden çok kullanıcıya/bot'a hizmet verir. Gelişmiş moderasyon, zamanlanmış mesajlar, abonelik sistemi ve çok daha fazlasını tek bir arayüzden yönetin.

![Version](https://img.shields.io/badge/version-2.2--saas-red)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)
![Fastify](https://img.shields.io/badge/Fastify-5-lightgrey)
![React](https://img.shields.io/badge/React-19-61DAFB)
![License](https://img.shields.io/badge/license-AGPL--3.0-orange)

---

## 🏢 SaaS / Multi-Tenant Mimarisi

Proje tamamen **SaaS (Software as a Service)** mimarisine dönüştürülmüştür:

- **Workspace (Tenant)** bazlı veri izolasyonu
- Her kullanıcı kendine ait workspace'inde çalışır
- **Super Admin** tüm workspace'leri yönetebilir
- **Plan bazlı limitler** (bot sayısı, grup sayısı, ekip üyesi sayısı)
- **3 hazır plan**: Free, Pro, Enterprise
- Her login'de otomatik workspace oluşturma
- JWT içinde `workspace_id` taşınır, tüm sorgular buna göre filtrelenir

### Plan Karşılaştırması

| Özellik | Free | Pro ($29/ay) | Enterprise ($99/ay) |
|---------|------|-------------|--------------------|
| Bot Sayısı | 1 | 3 | 10 |
| Grup/Kanal | 5 | 50 | 500 |
| Ekip Üyesi | 1 | 5 | 50 |
| Temel Moderasyon | ✅ | ✅ | ✅ |
| Gelişmiş Moderasyon | ❌ | ✅ | ✅ |
| CAPTCHA | ❌ | ✅ | ✅ |
| Planlayıcı | ❌ | ✅ | ✅ |
| Özel Komutlar | ❌ | ✅ | ✅ |
| Analitik | ❌ | ✅ | ✅ |
| Ekip Yönetimi | ❌ | ✅ | ✅ |
| White-Label | ❌ | ❌ | ✅ |
| Öncelikli Destek | ❌ | ❌ | ✅ |

---

## 📸 Ekran Görüntüleri

| Dashboard | Admin Panel | Abonelikler |
|-----------|-------------|-------------|
| ![Dashboard](https://placehold.co/400x250/1a1a2e/e74c3c?text=Dashboard) | ![Admin](https://placehold.co/400x250/1a1a2e/3498db?text=Admin+Panel) | ![Plans](https://placehold.co/400x250/1a1a2e/2ecc71?text=Plans) |

---

## ✨ Özellikler

### 🏢 SaaS & Multi-Tenant
- **Workspace Yönetimi** - Her kullanıcı kendi workspace'ine sahip
- **Abonelik Planları** - Free, Pro, Enterprise
- **Plan Limit Kontrolü** - Bot, chat, ekip üyesi sınırları
- **Super Admin Paneli** - Tüm workspace'leri yönetme
- **Dashboard İstatistikleri** - Workspace bazlı metrikler

### 🤖 Çoklu Bot Desteği
- Birden çok Telegram botunu tek panelden yönetin
- Webhook ve polling modu desteği
- Bot profili (ad, açıklama) güncelleme

### 💬 Grup Yönetimi
- Tüm grupları görüntüleme ve yönetme
- Hoş geldin mesajları (global ve grup bazlı)
- **Mesaj Geçmişi** - Son 50 mesajı görüntüleme
- **Üye Listesi** - Yöneticileri ve üyeleri görüntüleme
- **Yönetici Yönetimi** - Yönetici atama/yetkisini alma
- **Otomatik Yanıtlayıcı** - Tetikleyici kelimelere otomatik yanıt
- **Silinen/Düzenlenen Mesajlar** - Geçmiş kayıtları
- **Export/Import** - Grup ayarlarını JSON yedekleme

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

### 📋 Denetim ve Güvenlik
- **Denetim Kayıtları** - Tüm API çağrıları loglanır
- JWT tabanlı kimlik doğrulama
- RBAC (Super Admin / Admin / User rolleri)

### 💳 Abonelik & Plan Yönetimi
- Stripe webhook entegrasyonu
- Plan yükseltme/düşürme
- Deneme süresi yönetimi
- Kullanım istatistikleri

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
git clone https://github.com/ysf-bkr/TeleBot.git
cd TeleBot

# Bağımlılıkları yükle
npm run install:all

# Backend yapılandırması
cp backend/.env.example backend/.env
# .env dosyasını düzenleyin

# Geliştirme sunucusunu başlat
npm run dev
```

İlk çalıştırmada **Kurulum Sihirbazı** açılacak. Burada:
1. JWT Güvenlik Anahtarı
2. Admin e-posta ve şifresi
3. Telegram Bot Token'ı

bilgilerini girerek sistemi başlatabilirsiniz. Setup işlemi sırasında otomatik olarak workspace oluşturulur.

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

> ⚠️ **GÜVENLİK UYARISI:** Üretim ortamında varsayılan değerleri kullanmayın!

---

## 📂 Proje Yapısı

```
telegram-bot-panel/
├── backend/                          # Backend (Fastify + TypeScript)
│   ├── src/
│   │   ├── index.ts                  # Sunucu başlangıcı
│   │   ├── db/                       # Veritabanı (SQLite + Kysely)
│   │   ├── middleware/
│   │   │   ├── auth.ts               # JWT token oluşturma
│   │   │   ├── tenant.ts             # Tenant (workspace) middleware
│   │   │   └── planLimits.ts         # Plan limit kontrolü
│   │   ├── modules/
│   │   │   ├── saas/                 # 🆕 SaaS modülü
│   │   │   │   ├── workspace.controller.ts
│   │   │   │   └── workspace.routers.ts
│   │   │   ├── auth/                 # JWT, Telegram, Email giriş
│   │   │   ├── setup/                # Setup sihirbazı
│   │   │   └── ... (12 modül)
│   │   ├── repositories/
│   │   │   ├── workspace.repository.ts  # 🆕
│   │   │   ├── plan.repository.ts       # 🆕
│   │   │   └── subscription.repository.ts
│   │   └── types/
│   │       ├── db.ts                 # Veritabanı tipleri
│   │       └── fastify.ts            # Fastify deklarasyonları
│   │
│   ├── frontend/                     # Frontend (React + Panda CSS)
│   │   ├── src/
│   │   │   ├── App.tsx               # Ana uygulama + routing
│   │   │   ├── pages/
│   │   │   │   ├── admin/            # 🆕 Super Admin Panel
│   │   │   │   └── ... (17 sayfa)
│   │   │   └── lib/
│   │   │       ├── api.ts            # Axios API
│   │   │       └── i18n.ts           # Çoklu dil (TR/EN)
│   │   └── ...
│   └── ...
```

---

## 🛣️ API Route'ları (SaaS)

### Platform & Workspace
| Metot | Route | Açıklama |
|-------|-------|----------|
| GET | `/api/plans` | Plan listesi (public) |
| GET | `/api/workspace` | Kullanıcının workspace detayı + plan |
| PATCH | `/api/workspace` | Workspace güncelleme |
| GET | `/api/workspace/stats` | Dashboard istatistikleri |

### Super Admin
| Metot | Route | Açıklama |
|-------|-------|----------|
| GET | `/api/admin/workspaces` | Tüm workspace'ler |
| GET | `/api/admin/workspaces/:id` | Workspace detayı |
| POST | `/api/admin/workspaces` | Yeni workspace |
| PATCH | `/api/admin/workspaces/:id` | Workspace güncelleme |
| DELETE | `/api/admin/workspaces/:id` | Workspace silme |
| GET | `/api/admin/stats` | Platform istatistikleri |

### Setup
| Metot | Route | Açıklama |
|-------|-------|----------|
| GET | `/api/setup/status` | Kurulum durumu sorgulama |
| POST | `/api/setup/configure` | İlk kurulum (workspace + admin oluşturur) |

Diğer tüm route'lar mevcut yapısını korur, sadece `workspace_id` filtresi eklenmiştir.

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
- **Axios** - HTTP istemcisi
- **Socket.io Client** - Gerçek zamanlı
- **Lucide React** - İkon seti
- **Sonner** - Toast bildirimleri

---

## 📊 Frontend Sayfaları

| Sayfa | Route | Açıklama |
|-------|-------|----------|
| 🆕 Admin Panel | `/admin` | Super Admin - workspace yönetimi |
| Gösterge Paneli | `/dashboard` | Bot durumu, istatistikler |
| Sistem Ayarları | `/settings` | Bot token, profil, hoş geldin mesajı |
| Telegram Grupları | `/chats` | Grup listesi, toggle |
| Grup Detayı | `/chats/:id` | Mesajlar, üyeler, yöneticiler |
| Gelişmiş Moderasyon | `/moderation` | Ayarlar, CAPTCHA, blacklist |
| Mesaj Planlayıcı | `/scheduler` | Zamanlanmış gönderiler |
| Sayfalar | `/articles` | Makale CRUD |
| Grup Analitiği | `/analytics` | Metrikler |
| Canlı Aktivite | `/logs` | Gerçek zamanlı aktivite |
| Denetim Kayıtları | `/audit` | API logları |
| Özel Komutlar | `/commands` | Bot için /komutlar |
| Abonelikler | `/subscriptions` | Kullanıcı abonelikleri |

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

## 🤝 Katkıda Bulunma

1. Fork'layın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit'leyin (`git commit -m 'feat: add amazing feature'`)
4. Branch'inizi push'layın (`git push origin feature/amazing-feature`)
5. Pull Request açın

---

## 📄 Lisans

AGPL-3.0 License - Detaylar için [LICENSE](LICENSE) dosyasına bakın.

---

## 📞 İletişim

- GitHub: [github.com/ysf-bkr/TeleBot](https://github.com/ysf-bkr/TeleBot)
- Telegram: [@ysfbkr](https://t.me/ysfbkr)

---

> **Not:** Bu proje [@BotFather](https://t.me/BotFather) ile oluşturulan bot token'ları ile çalışır. İlk kurulumda Setup Wizard sizi adım adım yönlendirir.
