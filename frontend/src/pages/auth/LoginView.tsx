import { Lock, LogIn, Mail, MessageCircle } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { css } from '../../../styled-system/css';
import { flex, stack } from '../../../styled-system/patterns';
import { Button } from '../../components/ui/Button';
import { auth as authApi } from '../../lib/api';

export function LoginView({ onLogin }: { onLogin: (user: any) => void }) {
  const navigate = useNavigate();
  const [botUsername, setBotUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Panel Auth States
  const [authMethod] = useState<'telegram' | 'email'>('email');
  const [emailMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await authApi.config();
        if (res.data && res.data.botUsername) {
          setBotUsername(res.data.botUsername);
        }
      } catch (err) {
        console.error('Telegram login configuration could not be loaded:', err);
      }
      setLoading(false);
    };

    fetchConfig();
  }, []);

  useEffect(() => {
    if (!botUsername || authMethod !== 'telegram') return;

    // Define the global callback for Telegram Widget Login
    (window as any).onTelegramAuth = (user: any) => {
      onLogin(user);
    };

    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', botUsername);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-radius', '10');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-request-access', 'write');
    script.async = true;

    // Small delay to ensure container is rendered
    const timer = setTimeout(() => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
        containerRef.current.appendChild(script);
      }
    }, 50);

    return () => {
      clearTimeout(timer);
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
      delete (window as any).onTelegramAuth;
    };
  }, [botUsername, onLogin, authMethod]);


  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      toast.error('Lütfen tüm alanları doldurun');
      return;
    }

    setSubmitting(true);
    try {
      if (emailMode === 'login') {
        const res = await authApi.loginEmail({ email: trimmedEmail, password: trimmedPassword });
        onLogin(res.data);
        toast.success('Giriş başarılı');
      } else {
        const res = await authApi.registerEmail({ email: trimmedEmail, password: trimmedPassword });
        onLogin(res.data);
        toast.success('Kayıt oluşturuldu ve giriş yapıldı');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Giriş/Kayıt işlemi başarısız');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={css({
      minH: '100dvh',
      bg: 'bgCanvas',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      p: '4',
      color: 'textMain'
    })}>
      <div className={css({
        w: 'full',
        maxW: 'md',
        bg: 'bgSurface',
        p: { base: '8', md: '10' },
        borderRadius: 'xl',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: 'borderMain',
        boxShadow: '2xl'
      })}>
        <div className={flex({ align: 'center', gap: '3', mb: '8', justify: 'center' })}>
          <MessageCircle className={css({ w: '10', h: '10', color: 'primary' })} />
          <div>
            <h1 className={css({ fontSize: '2xl', fontWeight: 'bold', letterSpacing: 'tight', color: 'textMain' })}>TeleBot</h1>
            <p className={css({ fontSize: 'xs', color: 'textMuted' })}>Yönetici Kontrol Paneli</p>
          </div>
        </div>

        <form onSubmit={handleEmailSubmit} className={stack({ gap: '4', w: 'full', mt: '4' })}>
          <p className={css({ fontSize: 'sm', color: 'textMuted', textAlign: 'center', mb: '1' })}>
            Lütfen yönetici bilgilerinizi girin:
          </p>

          {/* Email Input */}
          <div className={css({ position: 'relative', w: 'full' })}>
            <Mail size={18} className={css({ position: 'absolute', left: '3', top: '50%', transform: 'translateY(-50%)', color: 'textMuted' })} />
            <input
              type="email"
              placeholder="E-posta Adresi"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
              className={css({
                w: 'full', bg: 'bgCanvas', border: '1px solid token(colors.borderMain)', borderRadius: 'lg',
                py: '2.5', pl: '10', pr: '4', color: 'textMain', fontSize: 'sm',
                outline: 'none', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                _hover: { borderColor: 'primary' },
                _focus: { borderColor: 'primary', boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.25)' }
              })}
              required
            />
          </div>

          {/* Password Input */}
          <div className={css({ position: 'relative', w: 'full' })}>
            <Lock size={18} className={css({ position: 'absolute', left: '3', top: '50%', transform: 'translateY(-50%)', color: 'textMuted' })} />
            <input
              type="password"
              placeholder="Şifre"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
              className={css({
                w: 'full', bg: 'bgCanvas', border: '1px solid token(colors.borderMain)', borderRadius: 'lg',
                py: '2.5', pl: '10', pr: '4', color: 'textMain', fontSize: 'sm',
                outline: 'none', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                _hover: { borderColor: 'primary' },
                _focus: { borderColor: 'primary', boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.25)' }
              })}
              required
            />
          </div>

          {/* Submit button */}
          <Button
            type="submit"
            disabled={submitting}
            className={css({ w: 'full', py: '2.5', mt: '2', bg: 'primary', color: 'white', fontWeight: '600', _hover: { bg: 'primaryHover' } })}
          >
            {submitting ? (
              'İşlem yapılıyor...'
            ) : (
              <span className={flex({ gap: '2', align: 'center', justify: 'center' })}><LogIn size={16} /> Giriş Yap</span>
            )}
          </Button>

          <div className={css({ textAlign: 'center', mt: '2' })}>
            <button
              type="button"
              onClick={() => navigate('/forgot-password')}
              className={css({ fontSize: 'sm', color: 'primary', cursor: 'pointer', border: 'none', bg: 'transparent', textDecoration: 'underline', _hover: { opacity: 0.8 } })}
            >
              Şifremi Unuttum
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LoginView;
