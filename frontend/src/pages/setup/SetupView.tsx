import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { css } from '../../../styled-system/css';
import { stack, flex } from '../../../styled-system/patterns';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { i18n } from '../../lib/i18n';
import { Languages, Moon, Sun, Shield, Lock, Mail, Key, KeyRound, Bot, Check, ArrowRight, ArrowLeft } from 'lucide-react';

export default function SetupView() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [licenseTypeChoice, setLicenseTypeChoice] = useState<'license' | 'trial'>('trial');
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

  const isStepValid = () => {
    if (currentStep === 1) {
      return licenseTypeChoice === 'trial' || licenseKey.trim().length > 0;
    }
    if (currentStep === 2) {
      return jwtSecret.trim().length >= 16;
    }
    if (currentStep === 3) {
      return adminEmail.trim().includes('@') && adminPassword.length >= 6;
    }
    if (currentStep === 4) {
      return botToken.trim().includes(':') && botToken.trim().length > 10;
    }
    return true;
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isStepValid()) {
      setCurrentStep(prev => prev + 1);
    } else {
      toast.error('Lütfen gerekli alanları doğru şekilde doldurun.');
    }
  };

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isStepValid()) return;
    setLoading(true);
    try {
      const finalLicense = licenseTypeChoice === 'trial' ? 'TRIAL' : licenseKey.trim();
      const response = await fetch('/api/setup/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licenseKey: finalLicense,
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

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return i18n.t('setup.step_license');
      case 2: return i18n.t('setup.step_security');
      case 3: return i18n.t('setup.step_admin');
      case 4: return i18n.t('setup.step_bot');
      case 5: return i18n.t('setup.step_confirm');
      default: return '';
    }
  };

  const choiceStyle = (active: boolean) => css({
    flex: 1,
    p: '5',
    borderRadius: 'xl',
    border: active ? '2px solid token(colors.primary)' : '1px solid token(colors.borderMain)',
    bg: active ? 'rgba(239, 68, 68, 0.04)' : 'bgCanvas',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '3',
    position: 'relative',
    _hover: {
      borderColor: active ? 'primary' : 'textMuted',
      bg: active ? 'rgba(239, 68, 68, 0.04)' : 'bgButtonSecondary'
    }
  });

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
            display: 'flex', alignItems: 'center', gap: '2',
            cursor: 'pointer', fontSize: 'sm', fontWeight: '500',
            border: '1px solid token(colors.borderMain)',
            transition: 'all 0.2s ease'
          })}
        >
          <Languages size={16} />
          {i18n.lang === 'tr' ? 'EN' : 'TR'}
        </button>

        <button
          onClick={toggleTheme}
          className={css({
            p: '2.5', borderRadius: 'xl',
            bg: 'bgButtonSecondary', color: 'textButtonSecondary',
            _hover: { bg: 'bgButtonSecondaryHover' },
            cursor: 'pointer',
            border: '1px solid token(colors.borderMain)',
            transition: 'all 0.2s ease'
          })}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>

      {/* Logo & Subtitle */}
      <div className={stack({ gap: '1', textAlign: 'center', mb: '6', zIndex: 1 })}>
        <div className={flex({ align: 'center', justify: 'center', gap: '2', color: 'primary', mb: '1' })}>
          <div className={css({ p: '2.5', borderRadius: '2xl', bg: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' })}>
            <Bot size={32} />
          </div>
        </div>
        <h1 className={css({ fontSize: '2xl', fontWeight: '800', color: 'textMain', letterSpacing: 'tight' })}>
          {i18n.t('setup.title')}
        </h1>
        <p className={css({ fontSize: 'xs', color: 'textMuted', maxW: '320px', mx: 'auto' })}>
          {i18n.t('setup.subtitle')}
        </p>
      </div>

      {/* Onboarding Steps Progress Tracker */}
      <div className={flex({ gap: '1.5', mb: '6', w: 'full', maxW: '480px', justify: 'space-between', align: 'center', px: '3', zIndex: 1 })}>
        {[1, 2, 3, 4, 5].map((step) => (
          <React.Fragment key={step}>
            <div className={flex({ 
              w: '9', h: '9', 
              borderRadius: 'full', 
              align: 'center', 
              justify: 'center', 
              fontWeight: '700',
              fontSize: 'xs',
              bg: currentStep === step ? 'primary' : currentStep > step ? 'rgba(16, 185, 129, 0.15)' : 'bgButtonSecondary',
              color: currentStep === step ? 'white' : currentStep > step ? 'rgb(16, 185, 129)' : 'textMuted',
              border: currentStep === step ? '2px solid token(colors.primary)' : currentStep > step ? '2px solid rgb(16, 185, 129)' : '1px solid token(colors.borderMain)',
              transition: 'all 0.3s ease'
            })}>
              {currentStep > step ? <Check size={14} /> : step}
            </div>
            {step < 5 && (
              <div className={css({ 
                flex: 1, 
                h: '0.5', 
                bg: currentStep > step ? 'rgb(16, 185, 129)' : 'borderMain',
                transition: 'all 0.3s ease'
              })} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Main Wizard Form Card */}
      <Card className={css({ w: 'full', maxW: '480px', zIndex: 1, position: 'relative', overflow: 'hidden' })}>
        <div className={stack({ gap: '6' })}>
          
          {/* Step Header */}
          <div className={flex({ justify: 'space-between', align: 'center', borderBottom: '1px solid token(colors.borderMain)', pb: '3' })}>
            <span className={css({ fontSize: 'xs', fontWeight: '700', color: 'primary', textTransform: 'uppercase', letterSpacing: 'wider' })}>
              Step {currentStep} of 5
            </span>
            <span className={css({ fontSize: 'sm', fontWeight: '700', color: 'textMain' })}>
              {getStepTitle()}
            </span>
          </div>

          <form onSubmit={handleSubmit} className={stack({ gap: '5' })}>
            
            {/* STEP 1: LICENSE OPTION */}
            {currentStep === 1 && (
              <div className={stack({ gap: '4' })}>
                <div className={flex({ gap: '3', w: 'full' })}>
                  <div 
                    onClick={() => setLicenseTypeChoice('trial')} 
                    className={choiceStyle(licenseTypeChoice === 'trial')}
                  >
                    <Shield size={24} className={css({ color: licenseTypeChoice === 'trial' ? 'primary' : 'textMuted' })} />
                    <div>
                      <div className={css({ fontSize: 'sm', fontWeight: '700', color: 'textMain' })}>{i18n.t('setup.lic_option_trial')}</div>
                      <div className={css({ fontSize: '10px', color: 'textMuted', mt: '1' })}>7 günlük deneme modunu ücretsiz başlatın.</div>
                    </div>
                  </div>

                  <div 
                    onClick={() => setLicenseTypeChoice('license')} 
                    className={choiceStyle(licenseTypeChoice === 'license')}
                  >
                    <Key size={24} className={css({ color: licenseTypeChoice === 'license' ? 'primary' : 'textMuted' })} />
                    <div>
                      <div className={css({ fontSize: 'sm', fontWeight: '700', color: 'textMain' })}>{i18n.t('setup.lic_option_full')}</div>
                      <div className={css({ fontSize: '10px', color: 'textMuted', mt: '1' })}>Satın aldığınız lisans anahtarını girin.</div>
                    </div>
                  </div>
                </div>

                {licenseTypeChoice === 'license' && (
                  <div className={stack({ gap: '1.5', mt: '2' })}>
                    <label className={css({ fontSize: 'xs', fontWeight: '700', color: 'textMain', textTransform: 'uppercase' })}>
                      {i18n.t('setup.license_key')}
                    </label>
                    <Input
                      type="text"
                      required
                      value={licenseKey}
                      onChange={e => setLicenseKey(e.target.value)}
                      placeholder="TELE-XXXXX-XXXXX-XXXXX-XXXXX"
                    />
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: SECURITY SETTINGS */}
            {currentStep === 2 && (
              <div className={stack({ gap: '4' })}>
                <div className={flex({ gap: '3', p: '3', bg: 'rgba(239, 68, 68, 0.04)', borderRadius: 'lg', border: '1px dashed rgba(239, 68, 68, 0.15)', fontSize: 'xs', color: 'textMuted' })}>
                  <Lock size={20} className={css({ color: 'primary', flexShrink: 0 })} />
                  <span>Kullanıcı oturumlarının güvenli bir şekilde imzalanması için karmaşık bir şifreleme anahtarı belirleyin.</span>
                </div>

                <div className={stack({ gap: '1.5' })}>
                  <label className={flex({ align: 'center', justify: 'space-between', fontSize: 'xs', fontWeight: '700', color: 'textMain', textTransform: 'uppercase' })}>
                    <span>{i18n.t('setup.jwt_secret')}</span>
                    <button 
                      type="button" 
                      onClick={generateRandomSecret}
                      className={css({ color: 'primary', fontSize: '10px', cursor: 'pointer', textTransform: 'none', _hover: { textDecoration: 'underline' } })}
                    >
                      (Rastgele Üret)
                    </button>
                  </label>
                  <Input
                    type="text"
                    required
                    value={jwtSecret}
                    onChange={e => setJwtSecret(e.target.value)}
                    placeholder={i18n.t('setup.jwt_placeholder')}
                  />
                </div>
              </div>
            )}

            {/* STEP 3: ADMINISTRATOR ACCOUNT */}
            {currentStep === 3 && (
              <div className={stack({ gap: '4' })}>
                <div className={stack({ gap: '1.5' })}>
                  <label className={flex({ align: 'center', gap: '2', fontSize: 'xs', fontWeight: '700', color: 'textMain', textTransform: 'uppercase' })}>
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
                  <label className={flex({ align: 'center', gap: '2', fontSize: 'xs', fontWeight: '700', color: 'textMain', textTransform: 'uppercase' })}>
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
            )}

            {/* STEP 4: TELEGRAM BOT CONFIGURATION */}
            {currentStep === 4 && (
              <div className={stack({ gap: '4' })}>
                <div className={stack({ gap: '1.5' })}>
                  <label className={flex({ align: 'center', gap: '2', fontSize: 'xs', fontWeight: '700', color: 'textMain', textTransform: 'uppercase' })}>
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

                <div className={stack({ gap: '1.5' })}>
                  <label className={flex({ align: 'center', gap: '2', fontSize: 'xs', fontWeight: '700', color: 'textMain', textTransform: 'uppercase' })}>
                    <Bot size={14} className={css({ color: 'primary' })} />
                    {i18n.t('setup.bot_username')}
                  </label>
                  <Input
                    type="text"
                    value={botUsername}
                    onChange={e => setBotUsername(e.target.value)}
                    placeholder="MyTelegramBot"
                  />
                </div>
              </div>
            )}

            {/* STEP 5: SETUP SUMMARY */}
            {currentStep === 5 && (
              <div className={stack({ gap: '4' })}>
                <p className={css({ fontSize: 'xs', color: 'textMuted' })}>
                  {i18n.t('setup.summary_desc')}
                </p>

                <div className={stack({ gap: '2.5', p: '4', bg: 'bgButtonSecondary', borderRadius: 'xl', border: '1px solid token(colors.borderMain)' })}>
                  <div className={flex({ justify: 'space-between', fontSize: 'xs' })}>
                    <span className={css({ color: 'textMuted' })}>{i18n.t('setup.license_key')}:</span>
                    <span className={css({ fontWeight: '700', color: 'textMain' })}>
                      {licenseTypeChoice === 'trial' ? '7-Day Trial Mode' : (licenseKey.slice(0, 10) + '...')}
                    </span>
                  </div>
                  <div className={flex({ justify: 'space-between', fontSize: 'xs' })}>
                    <span className={css({ color: 'textMuted' })}>{i18n.t('setup.admin_email')}:</span>
                    <span className={css({ fontWeight: '700', color: 'textMain' })}>{adminEmail}</span>
                  </div>
                  <div className={flex({ justify: 'space-between', fontSize: 'xs' })}>
                    <span className={css({ color: 'textMuted' })}>{i18n.t('setup.bot_token')}:</span>
                    <span className={css({ fontWeight: '700', color: 'textMain' })}>{botToken.slice(0, 12) + '...'}</span>
                  </div>
                  {botUsername && (
                    <div className={flex({ justify: 'space-between', fontSize: 'xs' })}>
                      <span className={css({ color: 'textMuted' })}>{i18n.t('setup.bot_username')}:</span>
                      <span className={css({ fontWeight: '700', color: 'textMain' })}>@{botUsername}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className={flex({ gap: '3', borderTop: '1px solid token(colors.borderMain)', pt: '4', mt: '2' })}>
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className={css({
                    px: '4', py: '2.5', borderRadius: 'xl',
                    bg: 'bgButtonSecondary', color: 'textButtonSecondary',
                    _hover: { bg: 'bgButtonSecondaryHover' },
                    cursor: 'pointer', fontSize: 'sm', fontWeight: '700',
                    display: 'flex', alignItems: 'center', gap: '2',
                    border: '1px solid token(colors.borderMain)',
                    transition: 'all 0.2s ease'
                  })}
                >
                  <ArrowLeft size={16} />
                  {i18n.t('setup.back')}
                </button>
              )}
              
              {currentStep < 5 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!isStepValid()}
                  className={css({
                    flex: 1, py: '2.5', borderRadius: 'xl',
                    bg: isStepValid() ? 'primary' : 'bgButtonSecondary',
                    color: isStepValid() ? 'white' : 'textMuted',
                    _hover: isStepValid() ? { bg: 'primaryHover' } : {},
                    cursor: isStepValid() ? 'pointer' : 'not-allowed',
                    fontSize: 'sm', fontWeight: '700',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2',
                    border: isStepValid() ? 'none' : '1px solid token(colors.borderMain)',
                    transition: 'all 0.2s ease'
                  })}
                >
                  {i18n.t('setup.next')}
                  <ArrowRight size={16} />
                </button>
              ) : (
                <Button 
                  type="submit" 
                  disabled={loading || !isStepValid()} 
                  className={css({ flex: 1, h: '42px', fontWeight: '700', borderRadius: 'xl' })}
                >
                  {loading ? i18n.t('setup.loading') : i18n.t('setup.submit')}
                </Button>
              )}
            </div>

          </form>
        </div>
      </Card>
    </div>
  );
}
