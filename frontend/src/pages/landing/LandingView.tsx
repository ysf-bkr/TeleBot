import { ArrowRight, BarChart, Bot, Calendar, Globe, Lock, MessageSquare, Shield, Users, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { css } from '../../../styled-system/css';
import { flex, grid, stack } from '../../../styled-system/patterns';
import { Button } from '../../components/ui/Button';

const features = [
  { icon: Bot, title: 'Bot Yönetimi', desc: 'Telegram botunuzu web panelinden kolayca yönetin, token güncelleyin, restart edin.' },
  { icon: Users, title: 'Çoklu Grup Desteği', desc: 'Sınırsız sayıda grubu tek panelden yönetin, her gruba özel ayarlar yapın.' },
  { icon: Shield, title: 'AI Moderasyon', desc: 'Gemini AI ile otomatik moderasyon, spam koruması, CAPTCHA doğrulama.' },
  { icon: MessageSquare, title: 'Markdown Mesajlar', desc: 'Zengin formatlı mesajlar gönderin, zamanlayın, otomatik yanıtlayıcılar oluşturun.' },
  { icon: Calendar, title: 'İçerik Planlayıcı', desc: 'Gönderileri zamanlayın, tekrarlayan paylaşımlar planlayın, otomatik silin.' },
  { icon: BarChart, title: 'Detaylı Analitik', desc: 'Grup büyümesini, mesaj istatistiklerini ve moderasyon raporlarını görüntüleyin.' },
];

export default function LandingView() {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem('token');

  return (
    <div className={css({ minH: '100dvh', bg: 'bgCanvas' })}>
      {/* Navbar */}
      <nav className={css({
        position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid token(colors.borderMain)',
        backdropFilter: 'blur(12px)',
        backgroundColor: 'rgba(255,255,255,0.8)',
        _dark: { backgroundColor: 'rgba(9,13,22,0.8)' }
      })}>
        <div className={css({ maxW: '1200px', mx: 'auto', px: '4', py: '3', display: 'flex', justifyContent: 'space-between', alignItems: 'center' })}>
          <div className={flex({ align: 'center', gap: '2' })}>
            <div className={css({ w: '8', h: '8', borderRadius: 'lg', bg: 'primary', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: 'sm' })}>TB</div>
            <span className={css({ fontWeight: 'bold', fontSize: 'lg' })}>Telegram Bot</span>
          </div>
          <div className={flex({ gap: '3' })}>
            {isLoggedIn ? (
              <Button onClick={() => navigate('/dashboard')}>Panele Git <ArrowRight size={16} /></Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate('/login')}>Giriş Yap</Button>
                <Button onClick={() => navigate('/login')}>Kayıt Ol</Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className={css({ maxW: '1200px', mx: 'auto', px: '4', py: { base: '16', md: '24' } })}>
        <div className={grid({ columns: { base: 1, md: 2 }, gap: '12' })}>
          <div className={stack({ gap: '6' })}>
            <div className={css({
              display: 'inline-flex', px: '3', py: '1', borderRadius: 'full', bg: 'primary', color: 'white',
              fontSize: 'xs', fontWeight: '600', alignSelf: 'flex-start'
            })}>🚀 Telegram Bot Yönetim Paneli</div>
            <h1 className={css({ fontSize: { base: '3xl', md: '5xl' }, fontWeight: 'bold', lineHeight: '1.1' })}>
              Telegram Gruplarınızı<br />
              <span className={css({ color: 'primary' })}>Web'den Yönetin</span>
            </h1>
            <p className={css({ fontSize: 'lg', color: 'textMuted', lineHeight: 'relaxed' })}>
              Gelişmiş moderasyon, AI destekli filtreleme, zamanlı paylaşımlar ve detaylı analitiklerle
              Telegram gruplarınızı tek bir panelden yönetin.
            </p>
            <div className={flex({ gap: '3' })}>
              <Button size="lg" onClick={() => navigate(isLoggedIn ? '/dashboard' : '/login')}>
                {isLoggedIn ? 'Panele Git' : 'Ücretsiz Başla'} <ArrowRight size={18} />
              </Button>
              <Button size="lg" variant="secondary" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
                Özellikleri Keşfet
              </Button>
            </div>
            <div className={flex({ gap: '6', color: 'textMuted', fontSize: 'sm' })}>
              <div className={flex({ align: 'center', gap: '1' })}><Zap size={14} className={css({ color: 'primary' })} /> Hızlı Kurulum</div>
              <div className={flex({ align: 'center', gap: '1' })}><Globe size={14} className={css({ color: 'primary' })} /> Çoklu Grup</div>
              <div className={flex({ align: 'center', gap: '1' })}><Lock size={14} className={css({ color: 'primary' })} /> Güvenli</div>
            </div>
          </div>
          <div className={css({ display: { base: 'none', md: 'block' } })}>
            <div className={css({
              p: '8', borderRadius: '2xl', bg: 'bgSurface', border: '1px solid token(colors.borderMain)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.1)'
            })}>
              <div className={stack({ gap: '4' })}>
                <div className={flex({ gap: '2', align: 'center' })}>
                  <div className={css({ w: '3', h: '3', borderRadius: 'full', bg: 'red.500' })} />
                  <div className={css({ w: '3', h: '3', borderRadius: 'full', bg: 'yellow.500' })} />
                  <div className={css({ w: '3', h: '3', borderRadius: 'full', bg: 'green.500' })} />
                </div>
                <div className={css({ p: '4', bg: 'bgCanvas', borderRadius: 'lg', fontFamily: 'monospace', fontSize: 'sm' })}>
                  <div className={css({ color: 'primary' })}>$ Gruplar: 12</div>
                  <div className={css({ color: 'success' })}>$ Mesajlar: 1,234</div>
                  <div className={css({ color: 'warning' })}>$ Moderasyon: 56 ihlal</div>
                  <div className={css({ color: 'textMuted' })}>$ Son 7 gün</div>
                </div>
                <div className={grid({ columns: 2, gap: '2' })}>
                  {['🤖 Bot Aktif', '🛡️ AI Koruma', '📊 Analitik', '📅 Planlayıcı'].map((item, i) => (
                    <div key={i} className={css({ p: '3', bg: 'bgCanvas', borderRadius: 'lg', fontSize: 'sm', textAlign: 'center' })}>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className={css({ maxW: '1200px', mx: 'auto', px: '4', py: { base: '16', md: '24' } })}>
        <div className={css({ textAlign: 'center', mb: '12' })}>
          <h2 className={css({ fontSize: { base: '2xl', md: '3xl' }, fontWeight: 'bold' })}>Güçlü Özellikler</h2>
          <p className={css({ color: 'textMuted', mt: '2' })}>Telegram gruplarınızı profesyonelce yönetmek için ihtiyacınız olan her şey</p>
        </div>
        <div className={grid({ columns: { base: 1, md: 2, lg: 3 }, gap: '6' })}>
          {features.map((f, i) => (
            <div key={i} className={css({
              p: '6', borderRadius: 'xl', bg: 'bgSurface', border: '1px solid token(colors.borderMain)',
              transition: 'all 0.2s', _hover: { borderColor: 'primary', transform: 'translateY(-2px)', boxShadow: '0 8px 24px rgba(0,0,0,0.05)' }
            })}>
              <div className={css({ w: '10', h: '10', borderRadius: 'lg', bg: 'primary', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: '3' })}>
                <f.icon size={20} />
              </div>
              <h3 className={css({ fontWeight: '600', mb: '1' })}>{f.title}</h3>
              <p className={css({ fontSize: 'sm', color: 'textMuted', lineHeight: 'relaxed' })}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className={css({ maxW: '1200px', mx: 'auto', px: '4', py: { base: '16', md: '24' }, textAlign: 'center' })}>
        <div className={css({
          p: { base: '8', md: '16' }, borderRadius: '2xl',
          background: 'linear-gradient(135deg, var(--colors-primary) 0%, #dc2626 100%)',
          color: 'white'
        })}>
          <h2 className={css({ fontSize: { base: '2xl', md: '3xl' }, fontWeight: 'bold', mb: '4' })}>
            Hemen Başlayın
          </h2>
          <p className={css({ fontSize: 'lg', opacity: '0.9', mb: '6', maxW: '600px', mx: 'auto' })}>
            Botunuzu kurun, gruplarınızı ekleyin ve gelişmiş özellikleri kullanmaya başlayın. Ücretsiz!
          </p>
          <Button size="lg" onClick={() => navigate(isLoggedIn ? '/dashboard' : '/login')} className={css({ bg: 'white', color: 'primary', _hover: { bg: 'gray.100' } })}>
            {isLoggedIn ? 'Panele Git' : 'Ücretsiz Başla'} <ArrowRight size={18} />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className={css({ borderTop: '1px solid token(colors.borderMain)', py: '8', textAlign: 'center', color: 'textMuted', fontSize: 'sm' })}>
        <p>Telegram Bot Yönetim Paneli &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
