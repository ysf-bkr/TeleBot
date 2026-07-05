import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BarChart, Bot, Calendar, Globe, Lock, MessageSquare, Shield, Users, Zap, Languages, Sun, Moon } from 'lucide-react';
import { css } from '../../../styled-system/css';
import { flex, grid, stack } from '../../../styled-system/patterns';
import { Button } from '../../components/ui/Button';
import { i18n } from '../../lib/i18n';

export default function LandingView() {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem('token');

  // Reactivity for language change
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

  const features = [
    { icon: Bot, title: i18n.t('landing.feature.bot.title'), desc: i18n.t('landing.feature.bot.desc') },
    { icon: Users, title: i18n.t('landing.feature.groups.title'), desc: i18n.t('landing.feature.groups.desc') },
    { icon: Shield, title: i18n.t('landing.feature.ai.title'), desc: i18n.t('landing.feature.ai.desc') },
    { icon: MessageSquare, title: i18n.t('landing.feature.markdown.title'), desc: i18n.t('landing.feature.markdown.desc') },
    { icon: Calendar, title: i18n.t('landing.feature.scheduler.title'), desc: i18n.t('landing.feature.scheduler.desc') },
    { icon: BarChart, title: i18n.t('landing.feature.analytics.title'), desc: i18n.t('landing.feature.analytics.desc') },
  ];

  return (
    <div className={css({ 
      minH: '100dvh', 
      bg: 'bgCanvas',
      color: 'textMain',
      position: 'relative',
      overflowX: 'hidden',
      transition: 'background-color 0.3s ease'
    })}>
      
      {/* Decorative Premium Mesh Gradients */}
      <div className={css({
        position: 'absolute',
        top: '-150px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100vw',
        height: '600px',
        background: 'radial-gradient(circle, rgba(239, 68, 68, 0.08) 0%, rgba(239, 68, 68, 0.02) 50%, transparent 100%)',
        pointerEvents: 'none',
        zIndex: 0
      })} />

      <div className={css({
        position: 'absolute',
        top: '600px',
        right: '-10%',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(239, 68, 68, 0.04) 0%, rgba(239, 68, 68, 0.01) 60%, transparent 100%)',
        pointerEvents: 'none',
        zIndex: 0
      })} />

      {/* Navbar */}
      <nav className={css({
        position: 'sticky', 
        top: 0, 
        zIndex: 50, 
        borderBottom: '1px solid token(colors.borderMain)',
        backdropFilter: 'blur(16px)',
        backgroundColor: 'rgba(255, 255, 255, 0.75)',
        _dark: { backgroundColor: 'rgba(9, 13, 22, 0.75)' },
        transition: 'all 0.3s ease'
      })}>
        <div className={css({ maxW: '1200px', mx: 'auto', px: { base: '4', md: '8' }, py: '4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' })}>
          <div className={flex({ align: 'center', gap: '3' })}>
            <div className={css({ 
              w: '9', 
              h: '9', 
              borderRadius: 'xl', 
              bg: 'primary', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: 'white', 
              fontWeight: '800', 
              fontSize: 'md',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
            })}>TB</div>
            <span className={css({ fontWeight: '800', fontSize: 'xl', letterSpacing: 'tight', bgGradient: 'to-r', gradientFrom: 'textMain', gradientTo: 'primary', bgClip: 'text', color: 'transparent' })}>TeleBot</span>
          </div>

          <div className={flex({ gap: '3', align: 'center' })}>
            {/* Language Switcher */}
            <button
              onClick={() => i18n.toggle()}
              className={css({
                p: '2.5', borderRadius: 'xl',
                bg: 'bgButtonSecondary', color: 'textButtonSecondary',
                _hover: { bg: 'bgButtonSecondaryHover', transform: 'scale(1.05)' },
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', fontSize: '12px', fontWeight: '700',
                gap: '1.5', transition: 'all 0.2s ease', border: 'none'
              })}
              title={i18n.lang === 'tr' ? 'Switch to English' : 'Türkçe\'ye geç'}
            >
              <Languages size={15} />
              {i18n.lang === 'tr' ? 'EN' : 'TR'}
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={css({
                p: '2.5', borderRadius: 'xl',
                bg: 'bgButtonSecondary', color: 'textButtonSecondary',
                _hover: { bg: 'bgButtonSecondaryHover', transform: 'scale(1.05)' },
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'all 0.2s ease', border: 'none'
              })}
              title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            >
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            <div className={css({ w: '1px', h: '6', bg: 'borderMain', mx: '1' })} />

            {isLoggedIn ? (
              <Button onClick={() => navigate('/dashboard')} className={css({ px: '5' })}>
                {i18n.t('landing.go_to_dashboard')} <ArrowRight size={16} />
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate('/login')} className={css({ px: '4' })}>
                  {i18n.t('landing.login')}
                </Button>
                <Button onClick={() => navigate('/login')} className={css({ px: '5' })}>
                  {i18n.t('landing.register')}
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className={css({ maxW: '1200px', mx: 'auto', px: { base: '4', md: '8' }, py: { base: '12', md: '28' }, position: 'relative', zIndex: 1 })}>
        <div className={grid({ columns: { base: 1, md: 12 }, gap: '12', alignItems: 'center' })}>
          
          {/* Hero Left Content */}
          <div className={stack({ gap: '6', gridColumn: { base: 'span 1', md: 'span 7' } })}>
            <div className={css({
              display: 'inline-flex', px: '4', py: '1.5', borderRadius: 'full', 
              bg: 'rgba(239, 68, 68, 0.08)', color: 'primary',
              borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(239, 68, 68, 0.2)',
              fontSize: 'xs', fontWeight: '700', alignSelf: 'flex-start',
              letterSpacing: 'wide'
            })}>{i18n.t('landing.tag')}</div>
            
            <h1 className={css({ 
              fontSize: { base: '3xl', sm: '4xl', md: '5xl', lg: '6xl' }, 
              fontWeight: '800', 
              lineHeight: '1.1',
              letterSpacing: 'tight'
            })}>
              {i18n.t('landing.hero_title_1')}<br />
              <span className={css({ 
                bgGradient: 'to-r',
                gradientFrom: 'primary',
                gradientTo: '#f43f5e',
                bgClip: 'text',
                color: 'transparent'
              })}>{i18n.t('landing.hero_title_2')}</span>
            </h1>
            
            <p className={css({ fontSize: 'lg', color: 'textMuted', lineHeight: 'relaxed', maxW: '540px' })}>
              {i18n.t('landing.hero_desc')}
            </p>
            
            <div className={flex({ gap: '4', flexWrap: 'wrap', mt: '2' })}>
              <Button size="lg" onClick={() => navigate(isLoggedIn ? '/dashboard' : '/login')} className={css({ px: '8', shadow: 'lg' })}>
                {isLoggedIn ? i18n.t('landing.go_to_dashboard') : i18n.t('landing.cta_free')} <ArrowRight size={18} />
              </Button>
              <Button size="lg" variant="secondary" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className={css({ px: '7' })}>
                {i18n.t('landing.explore_features')}
              </Button>
            </div>
            
            <div className={flex({ gap: '6', color: 'textMuted', fontSize: 'sm', flexWrap: 'wrap', pt: '4', borderTop: '1px solid token(colors.borderMain)', mt: '2' })}>
              <div className={flex({ align: 'center', gap: '2' })}><Zap size={15} className={css({ color: 'primary' })} /> {i18n.t('landing.fast_setup')}</div>
              <div className={flex({ align: 'center', gap: '2' })}><Globe size={15} className={css({ color: 'primary' })} /> {i18n.t('landing.multi_group')}</div>
              <div className={flex({ align: 'center', gap: '2' })}><Lock size={15} className={css({ color: 'primary' })} /> {i18n.t('landing.secure')}</div>
            </div>
          </div>

          {/* Hero Right Mockup representation */}
          <div className={css({ gridColumn: { base: 'span 1', md: 'span 5' }, position: 'relative' })}>
            <div className={css({
              position: 'absolute',
              inset: '-10px',
              bg: 'radial-gradient(circle, rgba(239, 68, 68, 0.15) 0%, transparent 70%)',
              filter: 'blur(30px)',
              zIndex: -1,
            })} />
            
            <div className={css({
              p: '6', borderRadius: '2xl', bg: 'bgSurface', 
              borderWidth: '1px', borderStyle: 'solid', borderColor: 'borderMain',
              boxShadow: '0 25px 60px -15px rgba(0,0,0,0.25)',
              _dark: { boxShadow: '0 25px 60px -15px rgba(0,0,0,0.7)' },
              transition: 'all 0.3s ease',
              _hover: { transform: 'scale(1.02)' }
            })}>
              <div className={stack({ gap: '5' })}>
                {/* Window buttons */}
                <div className={flex({ gap: '2', align: 'center' })}>
                  <div className={css({ w: '3', h: '3', borderRadius: 'full', bg: '#ff5f56' })} />
                  <div className={css({ w: '3', h: '3', borderRadius: 'full', bg: '#ffbd2e' })} />
                  <div className={css({ w: '3', h: '3', borderRadius: 'full', bg: '#27c93f' })} />
                  <div className={css({ fontSize: '10px', color: 'textMuted', ml: '3', fontFamily: 'monospace' })}>admin.telebot.panel</div>
                </div>

                {/* Console Metrics */}
                <div className={stack({ p: '4', bg: 'bgCanvas', borderRadius: 'xl', fontFamily: 'monospace', fontSize: 'sm', gap: '2.5', border: '1px solid token(colors.borderMain)' })}>
                  <div className={flex({ justify: 'space-between' })}>
                    <span className={css({ color: 'primary' })}>$ {i18n.t('landing.mockup.groups')}</span>
                    <span className={css({ color: 'success', fontWeight: 'bold' })}>● {i18n.t('online')}</span>
                  </div>
                  <div className={css({ color: 'textMain' })}>$ {i18n.t('landing.mockup.messages')}</div>
                  <div className={css({ color: 'warning' })}>$ {i18n.t('landing.mockup.moderation')}</div>
                  <div className={css({ color: 'textMuted', fontSize: 'xs' })}>// {i18n.t('landing.mockup.last_7_days')}</div>
                </div>

                {/* Features representation */}
                <div className={grid({ columns: 2, gap: '2.5' })}>
                  {[
                    i18n.t('landing.mockup.bot_active'), 
                    i18n.t('landing.mockup.ai_protection'), 
                    i18n.t('landing.mockup.analytics'), 
                    i18n.t('landing.mockup.scheduler')
                  ].map((item, i) => (
                    <div key={i} className={css({ 
                      p: '3.5', 
                      bg: 'bgCanvas', 
                      borderRadius: 'xl', 
                      fontSize: 'xs', 
                      fontWeight: '600',
                      textAlign: 'center',
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      borderColor: 'borderMain',
                      transition: 'all 0.2s',
                      _hover: { borderColor: 'primary', bg: 'bgSurface' }
                    })}>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className={css({ maxW: '1200px', mx: 'auto', px: { base: '4', md: '8' }, py: { base: '16', md: '24' }, position: 'relative', zIndex: 1 })}>
        <div className={css({ textAlign: 'center', mb: '16' })}>
          <h2 className={css({ fontSize: { base: '3xl', md: '4xl' }, fontWeight: '800', letterSpacing: 'tight' })}>{i18n.t('landing.features_title')}</h2>
          <p className={css({ color: 'textMuted', mt: '3', fontSize: 'md', maxW: '600px', mx: 'auto' })}>{i18n.t('landing.features_subtitle')}</p>
        </div>
        
        <div className={grid({ columns: { base: 1, sm: 2, lg: 3 }, gap: '6' })}>
          {features.map((f, i) => (
            <div key={i} className={css({
              p: '8', 
              borderRadius: '2xl', 
              bg: 'bgSurface', 
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: 'borderMain',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
              boxShadow: 'sm',
              _hover: { 
                borderColor: 'primary', 
                transform: 'translateY(-4px)', 
                boxShadow: '0 12px 30px -10px rgba(239, 68, 68, 0.15)' 
              }
            })}>
              <div className={css({ 
                w: '12', 
                h: '12', 
                borderRadius: 'xl', 
                bg: 'rgba(239, 68, 68, 0.08)', 
                color: 'primary', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                mb: '5',
                border: '1px solid rgba(239, 68, 68, 0.15)'
              })}>
                <f.icon size={22} />
              </div>
              <h3 className={css({ fontWeight: '700', fontSize: 'lg', mb: '2', letterSpacing: 'tight' })}>{f.title}</h3>
              <p className={css({ fontSize: 'sm', color: 'textMuted', lineHeight: 'relaxed' })}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Modern Gradient CTA Box */}
      <section className={css({ maxW: '1200px', mx: 'auto', px: { base: '4', md: '8' }, py: { base: '12', md: '20' }, position: 'relative', zIndex: 1 })}>
        <div className={css({
          p: { base: '10', md: '16' }, 
          borderRadius: '3xl',
          background: 'linear-gradient(135deg, var(--colors-primary) 0%, #be123c 100%)',
          color: 'white',
          textAlign: 'center',
          boxShadow: '0 20px 40px -15px rgba(239, 68, 68, 0.4)',
          position: 'relative',
          overflow: 'hidden'
        })}>
          {/* Overlay glow */}
          <div className={css({
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at top right, rgba(255,255,255,0.15) 0%, transparent 60%)',
            pointerEvents: 'none'
          })} />

          <h2 className={css({ fontSize: { base: '3xl', md: '4xl' }, fontWeight: '800', mb: '4', letterSpacing: 'tight' })}>
            {i18n.t('landing.cta_title')}
          </h2>
          <p className={css({ fontSize: 'lg', opacity: '0.9', mb: '8', maxW: '600px', mx: 'auto', lineHeight: 'relaxed' })}>
            {i18n.t('landing.cta_desc')}
          </p>
          <Button size="lg" onClick={() => navigate(isLoggedIn ? '/dashboard' : '/login')} className={css({ 
            bg: 'white', 
            color: 'primary', 
            fontWeight: '700',
            px: '8',
            _hover: { bg: 'gray.50', transform: 'scale(1.03)', boxShadow: 'xl' } 
          })}>
            {isLoggedIn ? i18n.t('landing.go_to_dashboard') : i18n.t('landing.cta_free')} <ArrowRight size={18} />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className={css({ 
        borderTop: '1px solid token(colors.borderMain)', 
        py: '10', 
        textAlign: 'center', 
        color: 'textMuted', 
        fontSize: 'sm',
        position: 'relative',
        zIndex: 1
      })}>
        <div className={css({ maxW: '1200px', mx: 'auto', px: '4' })}>
          <p className={css({ fontWeight: '500' })}>Telegram Bot {i18n.t('app.name')} &copy; {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}
