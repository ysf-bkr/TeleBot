import { Info, KeyRound, MessageSquare, RefreshCw, RotateCcw, Save } from 'lucide-react';
import React from 'react';
import { css } from '../../../styled-system/css';
import { flex, stack } from '../../../styled-system/patterns';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input, Textarea } from '../../components/ui/Input';
import { PageHeader } from '../../components/ui/PageHeader';

const DEFAULT_WELCOME = '👋 Hoş geldin {first_name}!\nGrubumuza katıldığın için teşekkürler.\n\n{group_title}';
const VARIABLE_OPTIONS = ['{first_name}', '{last_name}', '{username}', '{group_title}'];

interface SettingsViewProps {
  settings: any;
  welcomeText: string;
  setWelcomeText: React.Dispatch<React.SetStateAction<string>>;
  welcomeEnabled: boolean;
  setWelcomeEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  parseMode: string;
  setParseMode: React.Dispatch<React.SetStateAction<string>>;
  newToken: string;
  setNewToken: React.Dispatch<React.SetStateAction<string>>;
  onSaveSettings: () => Promise<void>;
  onUpdateToken: () => Promise<void>;
  onFetchBotInfo: () => Promise<void>;
  onRestartBot: () => Promise<void>;
  botInfo: any;
  onUpdateBotProfile: (name: string, description: string) => Promise<void>;
}

export function SettingsView({
  settings, welcomeText, setWelcomeText, welcomeEnabled, setWelcomeEnabled,
  parseMode, setParseMode, newToken, setNewToken,
  onSaveSettings, onUpdateToken, onFetchBotInfo, onRestartBot, botInfo, onUpdateBotProfile
}: SettingsViewProps) {
  const [profileName, setProfileName] = React.useState('');
  const [profileDesc, setProfileDesc] = React.useState('');
  const [activeTab, setActiveTab] = React.useState<'bot' | 'welcome'>('bot');

  React.useEffect(() => {
    if (botInfo?.first_name) setProfileName(botInfo.first_name);
  }, [botInfo]);

  const insertVariable = (variable: string) => {
    setWelcomeText((prev = '') => {
      const trimmed = prev.trimEnd();
      const sep = trimmed.length > 0 ? ' ' : '';
      return trimmed + sep + variable;
    });
  };

  const resetToDefault = () => setWelcomeText(DEFAULT_WELCOME);

  const previewText = React.useMemo(() => {
    const text = welcomeText || '';
    if (!text.trim()) return 'Mesaj içeriği boş.';
    return text
      .replace(/\{first_name\}/g, 'Ahmet')
      .replace(/\{last_name\}/g, 'Yılmaz')
      .replace(/\{username\}/g, 'ahmetyilmaz')
      .replace(/\{group_title\}/g, 'Proje Grubu');
  }, [welcomeText]);

  const ParseModeToggle = () => (
    <div className={flex({ gap: '1', align: 'center' })}>
      <span className={css({ fontSize: 'sm', color: 'textMuted', mr: '1' })}>Parse Modu:</span>
      {['HTML', 'MarkdownV2'].map((mode) => (
        <button key={mode} type="button" onClick={() => setParseMode(mode)}
          className={css({ px: '3', py: '1.5', fontSize: 'sm', borderRadius: 'lg', borderWidth: '1px', borderStyle: 'solid',
            borderColor: parseMode === mode ? 'primary' : 'borderMain', bg: parseMode === mode ? 'primary' : 'bgSurface',
            color: parseMode === mode ? 'white' : 'textMain', cursor: 'pointer', transition: 'all 0.1s ease',
            _hover: { borderColor: 'primary', ...(parseMode !== mode && { bg: 'bgCanvas' }) }
          })}>{mode}</button>
      ))}
    </div>
  );

  return (
    <div className={stack({ gap: '6' })}>
      <PageHeader title="Ayarlar" description="Bot token yapılandırması, profil ayarları ve hoş geldin mesajları." />

      {/* Tabs */}
      <div className={flex({ borderBottom: '1px solid token(colors.borderMain)', gap: '2', mb: '2', overflowX: 'auto' })}>
        {[
          { id: 'bot', label: 'Bot Yapılandırması & Profil', icon: KeyRound },
          { id: 'welcome', label: 'Hoş Geldin & Kurallar', icon: MessageSquare },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
              className={css({ display: 'flex', alignItems: 'center', gap: '2', px: '4', py: '3', fontSize: 'sm', fontWeight: '600',
                borderBottom: isActive ? '2px solid token(colors.primary)' : '2px solid transparent',
                color: isActive ? 'primary' : 'textMuted', cursor: 'pointer', background: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none',
                whiteSpace: 'nowrap', _hover: { color: 'primary' } })}>
              <Icon size={15} /> {tab.label}
            </button>
          );
        })}
      </div>

      <div className={stack({ gap: '6' })}>
        {activeTab === 'bot' && (
          <>
            <Card>
              <div className={flex({ align: 'center', gap: '2', mb: '4' })}>
                <div className={css({ p: '1.5', borderRadius: 'lg', bg: 'bgButtonSecondary', color: 'primary' })}><KeyRound size={18} /></div>
                <div className={css({ fontWeight: '600', color: 'textMain' })}>Bot Token Yapılandırması</div>
              </div>
              <div className={flex({ gap: '3', flexDir: { base: 'column', sm: 'row' } })}>
                <Input className={css({ fontFamily: 'monospace' })} placeholder="123456789:ABCDEF..." value={newToken} onChange={e => setNewToken(e.target.value)} />
                <Button onClick={onUpdateToken} variant="secondary">Güncelle ve Yeniden Başlat</Button>
                {onRestartBot && <Button onClick={onRestartBot} variant="ghost" size="sm">Yeniden Başlat</Button>}
              </div>
              <div className={css({ mt: '3', fontSize: 'sm' })}>
                <span className={css({ color: 'textMuted' })}>Mevcut token: </span>
                <code className={css({ fontFamily: 'monospace', bg: 'bgCanvas', px: '2', py: '0.5', borderRadius: 'sm', fontSize: 'xs', color: 'textMain' })}>
                  {settings?.token || 'Henüz ayarlanmadı'}
                </code>
              </div>
              <div className={flex({ align: 'center', gap: '2', mt: '3' })}>
                <Button onClick={onFetchBotInfo} variant="ghost" size="sm"><RefreshCw size={16} /> Bot Bilgilerini Getir</Button>
                {botInfo && (
                  <div className={css({ display: 'inline-flex', alignItems: 'center', gap: '2', px: '3', py: '1', bg: 'bgCanvas', borderRadius: 'md', fontSize: 'sm', border: '1px solid', borderColor: botInfo.connected ? 'borderMain' : 'danger' })}>
                    <span className={css({ color: botInfo.connected ? 'success' : 'danger' })}>●</span>
                    {botInfo.connected ? (
                      <><strong>@{botInfo.username}</strong> — {botInfo.first_name}{botInfo.id && <span className={css({ color: 'textMuted', ml: '1' })}>ID: {botInfo.id}</span>}</>
                    ) : (
                      <span className={css({ color: 'danger' })}>Bağlantı Başarısız: {botInfo.lastError || 'Token geçersiz'}</span>
                    )}
                  </div>
                )}
              </div>
              <p className={css({ fontSize: 'xs', color: 'textMuted', mt: '3' })}>Token değiştirildiğinde bot otomatik olarak yeniden başlatılır.</p>
            </Card>

            {botInfo && botInfo.connected && (
              <Card>
                <div className={flex({ align: 'center', gap: '2', mb: '4' })}>
                  <div className={css({ p: '1.5', borderRadius: 'lg', bg: 'bgButtonSecondary', color: 'primary' })}><KeyRound size={18} /></div>
                  <div className={css({ fontWeight: '600', color: 'textMain' })}>Bot Profil Bilgilerini Güncelle</div>
                </div>
                <div className={stack({ gap: '4' })}>
                  <div>
                    <label className={css({ fontSize: 'sm', fontWeight: '500', display: 'block', mb: '1.5', color: 'textMain' })}>Bot Görünen Adı</label>
                    <Input placeholder="Örn: Benim Yardımcı Botum" value={profileName} onChange={e => setProfileName(e.target.value)} />
                  </div>
                  <div>
                    <label className={css({ fontSize: 'sm', fontWeight: '500', display: 'block', mb: '1.5', color: 'textMain' })}>Bot Açıklaması</label>
                    <Textarea placeholder="Botunuz ne işe yarıyor?" value={profileDesc} onChange={e => setProfileDesc(e.target.value)} rows={3} />
                  </div>
                  <div className={flex({ gap: '3', align: 'center', flexWrap: 'wrap', justify: 'space-between' })}>
                    <p className={css({ fontSize: 'xs', color: 'textMuted', maxW: '70%' })}>
                      ⚠️ Bot profil resmi yalnızca <strong>@BotFather</strong> üzerinden değiştirilebilir.
                    </p>
                    <Button onClick={() => onUpdateBotProfile(profileName, profileDesc)} size="sm">Profili Telegram'da Güncelle</Button>
                  </div>
                </div>
              </Card>
            )}
          </>
        )}

        {activeTab === 'welcome' && (
          <Card>
            <div className={flex({ align: 'center', gap: '2', mb: '4' })}>
              <div className={css({ p: '1.5', borderRadius: 'lg', bg: 'bgButtonSecondary', color: 'primary' })}><MessageSquare size={18} /></div>
              <div className={css({ fontWeight: '600', color: 'textMain' })}>Global Hoş Geldin Mesajı</div>
            </div>
            <Textarea value={welcomeText} onChange={e => setWelcomeText(e.target.value)} placeholder="Hoş geldin mesajı yazın..." className={css({ minH: '150px' })} />
            <div className={css({ mt: '3' })}>
              <div className={css({ fontSize: 'xs', color: 'textMuted', mb: '1.5' })}>Değişkenler (tıklayarak ekleyin):</div>
              <div className={flex({ gap: '2', flexWrap: 'wrap' })}>
                {VARIABLE_OPTIONS.map((v) => (
                  <button key={v} type="button" onClick={() => insertVariable(v)}
                    className={css({ fontFamily: 'monospace', fontSize: 'xs', px: '2.5', py: '1', borderRadius: 'md', border: '1px solid token(colors.borderMain)', bg: 'bgCanvas', color: 'textMain', cursor: 'pointer', _hover: { bg: 'bgButtonSecondary', borderColor: 'primary' } })}>{v}</button>
                ))}
              </div>
            </div>
            <div className={css({ mt: '4' })}>
              <div className={css({ fontSize: 'xs', color: 'textMuted', mb: '1.5', display: 'flex', alignItems: 'center', gap: '1' })}>
                <Info size={14} /> Canlı Önizleme
              </div>
              <div className={css({ p: '3', bg: 'bgCanvas', borderRadius: 'lg', border: '1px solid token(colors.borderMain)', fontSize: 'sm', fontFamily: 'monospace', whiteSpace: 'pre-wrap', minH: '60px', color: 'textMain' })}>
                {previewText}
              </div>
            </div>
            <div className={flex({ gap: '3', mt: '4', flexWrap: 'wrap', align: 'center', justify: 'space-between' })}>
              <div className={flex({ gap: '4', align: 'center', flexWrap: 'wrap' })}>
                <label className={flex({ align: 'center', gap: '2', fontSize: 'sm', color: 'textMain', cursor: 'pointer' })}>
                  <input type="checkbox" checked={welcomeEnabled} onChange={e => setWelcomeEnabled(e.target.checked)} /> Global mesaj aktif
                </label>
                <ParseModeToggle />
              </div>
              <div className={flex({ gap: '2' })}>
                <Button onClick={resetToDefault} variant="ghost" size="sm"><RotateCcw size={16} /> Varsayılana Sıfırla</Button>
                <Button onClick={onSaveSettings}><Save size={18} /> Kaydet</Button>
              </div>
            </div>
          </Card>
        )}
      </div>

      <div className={flex({ gap: '2', p: '3', bg: 'bgCanvas', borderRadius: 'lg', border: '1px solid token(colors.borderMain)', color: 'textMuted', fontSize: 'sm' })}>
        <Info size={16} className={css({ mt: '1', flexShrink: 0 })} />
        <div>Not: Her grubun kendine özgü hoş geldin mesajı olabilir. Grup bazlı ayarlar için <strong>Gruplar</strong> sekmesine bakın.</div>
      </div>
    </div>
  );
}

export default SettingsView;
