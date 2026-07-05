import { ArrowRight, BarChart, Bot, Calendar, Check, MessageSquare, Shield, Users } from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { css } from '../../../styled-system/css';
import { flex, stack } from '../../../styled-system/patterns';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

const steps = [
  {
    title: '🤖 Bot Token Gir',
    description: 'İlk adımda Telegram Bot Token\'ınızı sisteme tanıtın. BotFather\'dan aldığınız token\'ı Ayarlar sayfasına girin.',
    action: 'Ayarlara Git',
    link: '/settings',
    icon: Bot,
  },
  {
    title: '👥 Botu Gruba Ekle',
    description: 'Botu Telegram gruplarınıza ekleyin ve yönetici yapın. Bot otomatik olarak grupları algılayacaktır.',
    action: 'Gruplara Git',
    link: '/chats',
    icon: Users,
  },
  {
    title: '🛡️ Moderasyonu Aktifleştir',
    description: 'Otomatik moderasyonu açın, yasaklı kelimeleri ekleyin ve AI moderasyonu etkinleştirin.',
    action: 'Moderasyona Git',
    link: '/moderation',
    icon: Shield,
  },
  {
    title: '📨 Hoş Geldin Mesajı Ayarla',
    description: 'Yeni katılan üyelere özel Markdown formatında hoş geldin mesajları gönderin.',
    action: 'Ayarlara Git',
    link: '/settings',
    icon: MessageSquare,
  },
  {
    title: '📅 Mesaj Planlayıcıyı Keşfet',
    description: 'Zamanlanmış gönderiler oluşturun, tekrarlayan paylaşımlar planlayın.',
    action: 'Planlayıcıya Git',
    link: '/scheduler',
    icon: Calendar,
  },
  {
    title: '📊 Analizleri İncele',
    description: 'Grup büyümesini, mesaj istatistiklerini ve moderasyon raporlarını görüntüleyin.',
    action: 'Analitiklere Git',
    link: '/analytics',
    icon: BarChart,
  },
];

export default function OnboardingView() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState<number[]>([]);

  const handleAction = (link: string, index: number) => {
    if (!completed.includes(index)) {
      setCompleted([...completed, index]);
    }
    navigate(link);
  };

  const handleSkip = () => {
    localStorage.setItem('onboarding_done', 'true');
    navigate('/dashboard');
  };

  const handleFinish = () => {
    localStorage.setItem('onboarding_done', 'true');
    navigate('/dashboard');
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className={css({
      minH: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      bg: 'bgCanvas', p: '4'
    })}>
      <Card className={css({ w: 'full', maxW: '600px', p: '8' })}>
        {/* Progress Bar */}
        <div className={css({ w: 'full', h: '2', bg: 'bgButtonSecondary', borderRadius: 'full', mb: '6', overflow: 'hidden' })}>
          <div className={css({ h: 'full', bg: 'primary', borderRadius: 'full', transition: 'width 0.5s ease' })}
            style={{ width: `${progress}%` }} />
        </div>

        {/* Step Counter */}
        <div className={css({ textAlign: 'center', mb: '2', fontSize: 'sm', color: 'textMuted' })}>
          Adım {currentStep + 1} / {steps.length}
        </div>

        {/* Step Content */}
        <div className={stack({ gap: '6', align: 'center' })}>
          <div className={css({
            w: '20', h: '20', borderRadius: 'full', bg: 'primary', color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4xl'
          })}>
            {React.createElement(steps[currentStep].icon, { size: 40 })}
          </div>

          <h1 className={css({ fontSize: '2xl', fontWeight: 'bold', textAlign: 'center' })}>
            {steps[currentStep].title}
          </h1>

          <p className={css({ fontSize: 'sm', color: 'textMuted', textAlign: 'center', lineHeight: 'relaxed', maxW: 'md' })}>
            {steps[currentStep].description}
          </p>

          {/* Completed Badge */}
          {completed.includes(currentStep) && (
            <div className={css({
              display: 'flex', alignItems: 'center', gap: '2', px: '4', py: '2',
              bg: 'success', color: 'white', borderRadius: 'full', fontSize: 'sm', fontWeight: '600'
            })}>
              <Check size={16} /> Tamamlandı
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className={flex({ gap: '3', mt: '8', justify: 'center' })}>
          {currentStep > 0 && (
            <Button variant="secondary" onClick={() => setCurrentStep(currentStep - 1)}>
              ← Geri
            </Button>
          )}

          <Button onClick={() => handleAction(steps[currentStep].link, currentStep)}>
            {steps[currentStep].action} <ArrowRight size={16} />
          </Button>

          {currentStep < steps.length - 1 ? (
            <Button variant="ghost" onClick={() => setCurrentStep(currentStep + 1)}>
              Geç →
            </Button>
          ) : (
            <Button onClick={handleFinish}>
              🎉 Başladım!
            </Button>
          )}
        </div>

        {/* Skip */}
        <div className={css({ textAlign: 'center', mt: '4' })}>
          <button onClick={handleSkip}
            className={css({ fontSize: 'xs', color: 'textMuted', cursor: 'pointer', textDecoration: 'underline', border: 'none', bg: 'transparent' })}>
            Bu rehberi atla, daha sonra göster
          </button>
        </div>
      </Card>
    </div>
  );
}
