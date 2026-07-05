import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { css } from '../../../styled-system/css';
import { stack, flex, grid } from '../../../styled-system/patterns';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { i18n } from '../../lib/i18n';
import { Languages, Moon, Sun, Shield, Lock, Mail, Key, KeyRound, Bot } from 'lucide-react';

export default function SetupView() {
  const navigate = useNavigate();
  const [licenseKey, setLicenseKey] = useState('');
  const [jwtSecret, setJwtSecret] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [botToken, setBotToken] = useState('');
  const [botUsername, setBotUsername] = useState('');
  const [loading, setLoading] = useState(false);

  // i18n reactivity
  const [, setLangVersion] = useState(0);
  useEffect(() => {
    const unsub = i18n.onChange(() => setLangVersion(v => v + 1));
    return () => { unsub(); };
  }, []);

  // Theme support
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
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

  // Check if system is already setup. If so, redirect away.
  useEffect(() => {
    fetch('/api/setup/status')
      .then(res => res.json())
      .then(data => {
        if (data.configured) {
          toast.info(i18n.t('setup.already_configured'));
          navigate('/login');
        }
      })
      .catch(() => {});
  }, [navigate]);

  const generateRandomSecret = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+';
    let secret = '';
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setJwtSecret(secret);
    toast.success(i18n.t('setup.gen_secret_success'));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/setup/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licenseKey,
          jwtSecret,
          adminEmail,
          adminPassword,
          botToken,
          botUsername
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || i18n.t('setup.error'));
      }

      toast.success(i18n.t('setup.success'));
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (err: any) {
      toast.error(err.message || i18n.t('setup.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={css({ 
      minH: '100dvh', 
      display: 'flex', 
      flexDirection: 'column',
      justifyContent: 'center', 
      alignItems: 'center', 
      bg: 'bgCanvas', 
      p: '4',
      position: 'relative',
      overflowX: 'hidden'
    })}>
      {/* Background Mesh Glow */}
      <div className={css({
        position: 'absolute',
        top: '-150px',
        width: '100vw',
        height: '500px',
        background: 'radial-gradient(circle, rgba(239, 68, 68, 0.08) 0%, transparent 80%)',
        pointerEvents: 'none',
        zIndex: 0
      })} />

      {/* Floating Header Actions */}
      <div className={css({ position: 'absolute', top: '4', right: '4', display: 'flex', gap: '2', zIndex: 10 })}>
        <button
          onClick={() => i18n.toggle()}
          className={css({
            p: '2.5', borderRadius: 'xl',
            bg: 'bgButtonSecondary', color: 'textButtonSecondary',
            _hover: { bg: 'bgButtonSecondaryHover' },
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontSize: '12px', fontWeight: '700',
            gap: '1.5', border: 'none'
          })}
        >
          <Languages size={14} />
          {i18n.lang === 'tr' ? 'EN' : 'TR'}
        </button>

        <button
          onClick={toggleTheme}
          className={css({
            p: '2.5', borderRadius: 'xl',
            bg: 'bgButtonSecondary', color: 'textButtonSecondary',
            _hover: { bg: 'bgButtonSecondaryHover' },
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', border: 'none'
          })}
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      </div>

      <Card className={css({ w: 'full', maxW: '550px', p: { base: '6', md: '8' }, position: 'relative', zIndex: 1 })}>
        <div className={stack({ gap: '6' })}>
          <div className={css({ textAlign: 'center' })}>
            <div className={css({ 
              w: '12', 
              h: '12', 
              borderRadius: '2xl', 
              bg: 'primary', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: 'white', 
              fontSize: 'lg',
              fontWeight: 'bold',
              mx: 'auto',
              mb: '3',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
            })}>TB</div>
            <h1 className={css({ fontSize: '2xl', fontWeight: '800', letterSpacing: 'tight', color: 'textMain' })}>
              {i18n.t('setup.title')}
            </h1>
            <p className={css({ fontSize: 'sm', color: 'textMuted', mt: '1' })}>
              {i18n.t('setup.subtitle')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className={stack({ gap: '5' })}>
            {/* Step 1: License */}
            <div className={stack({ gap: '1.5' })}>
              <label className={flex({ align: 'center', gap: '2', fontSize: 'xs', fontWeight: '700', color: 'textMain', textTransform: 'uppercase', letterSpacing: 'wider' })}>
                <Shield size={14} className={css({ color: 'primary' })} />
                {i18n.t('setup.license_key')}
              </label>
              <Input
                type="text"
                value={licenseKey}
                onChange={e => setLicenseKey(e.target.value)}
                placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX (or TRIAL)"
              />
              <span className={css({ fontSize: '11px', color: 'textMuted' })}>
                {i18n.t('setup.license_desc')}
              </span>
            </div>

            {/* Step 2: JWT Secret */}
            <div className={stack({ gap: '1.5' })}>
              <label className={flex({ align: 'center', gap: '2', fontSize: 'xs', fontWeight: '700', color: 'textMain', textTransform: 'uppercase', letterSpacing: 'wider' })}>
                <Lock size={14} className={css({ color: 'primary' })} />
                {i18n.t('setup.jwt_secret')}
              </label>
              <div className={flex({ gap: '2' })}>
                <Input
                  type="text"
                  required
                  value={jwtSecret}
                  onChange={e => setJwtSecret(e.target.value)}
                  placeholder={i18n.t('setup.jwt_placeholder')}
                  className={css({ flex: 1 })}
                />
                <Button type="button" variant="secondary" onClick={generateRandomSecret} className={css({ px: '3', flexShrink: 0 })}>
                  <Key size={16} />
                </Button>
              </div>
              <span className={css({ fontSize: '11px', color: 'textMuted' })}>
                {i18n.t('setup.jwt_desc')}
              </span>
            </div>

            {/* Step 3: Admin User */}
            <div className={grid({ columns: { base: 1, sm: 2 }, gap: '4' })}>
              <div className={stack({ gap: '1.5' })}>
                <label className={flex({ align: 'center', gap: '2', fontSize: 'xs', fontWeight: '700', color: 'textMain', textTransform: 'uppercase', letterSpacing: 'wider' })}>
                  <Mail size={14} className={css({ color: 'primary' })} />
                  {i18n.t('setup.admin_email')}
                </label>
                <Input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={e => setAdminEmail(e.target.value)}
                  placeholder="admin@example.com"
                />
              </div>

              <div className={stack({ gap: '1.5' })}>
                <label className={flex({ align: 'center', gap: '2', fontSize: 'xs', fontWeight: '700', color: 'textMain', textTransform: 'uppercase', letterSpacing: 'wider' })}>
                  <KeyRound size={14} className={css({ color: 'primary' })} />
                  {i18n.t('setup.admin_password')}
                </label>
                <Input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={e => setAdminPassword(e.target.value)}
                  placeholder={i18n.t('setup.password_placeholder')}
                />
              </div>
            </div>

            {/* Step 4: Bot Token */}
            <div className={stack({ gap: '1.5' })}>
              <label className={flex({ align: 'center', gap: '2', fontSize: 'xs', fontWeight: '700', color: 'textMain', textTransform: 'uppercase', letterSpacing: 'wider' })}>
                <Bot size={14} className={css({ color: 'primary' })} />
                {i18n.t('setup.bot_token')}
              </label>
              <Input
                type="text"
                required
                value={botToken}
                onChange={e => setBotToken(e.target.value)}
                placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
              />
            </div>

            {/* Step 5: Bot Username */}
            <div className={stack({ gap: '1.5' })}>
              <label className={flex({ align: 'center', gap: '2', fontSize: 'xs', fontWeight: '700', color: 'textMain', textTransform: 'uppercase', letterSpacing: 'wider' })}>
                <Bot size={14} className={css({ color: 'primary' })} />
                {i18n.t('setup.bot_username')}
              </label>
              <Input
                type="text"
                value={botUsername}
                onChange={e => setBotUsername(e.target.value)}
                placeholder="TeleBot (without @)"
              />
            </div>

            <Button type="submit" disabled={loading} className={css({ w: 'full', mt: '2', h: '46px', fontWeight: '700' })}>
              {loading ? i18n.t('setup.loading') : i18n.t('setup.submit')}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
