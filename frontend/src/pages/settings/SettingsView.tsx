import { Info, KeyRound, MessageSquare, RefreshCw, RotateCcw, Save, Sparkles } from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';
import { css } from '../../../styled-system/css';
import { flex, stack } from '../../../styled-system/patterns';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input, Textarea } from '../../components/ui/Input';
import { PageHeader } from '../../components/ui/PageHeader';
import { i18n } from '../../lib/i18n';

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
  const [activeTab, setActiveTab] = React.useState<'bot' | 'welcome' | 'ai'>('bot');

  // AI Moderation configuration local state
  const [aiProvider, setAiProvider] = React.useState('gemini');
  const [aiModel, setAiModel] = React.useState('gemini-2.5-flash');
  const [aiApiKey, setAiApiKey] = React.useState('');
  const [aiCustomUrl, setAiCustomUrl] = React.useState('');
  const [aiPrompt, setAiPrompt] = React.useState(`Sen bir Telegram grubu yapay zeka moderatörüsün. Aşağıdaki mesajı analiz et ve kuralları (ağır küfür, nefret söylemi, taciz, dolandırıcılık, yasadışı reklam) ihlal edip etmediğini belirle.
Sonucu tam olarak şu JSON şablonunda döndür (başka hiçbir metin veya markdown backtick ekleme, sadece saf JSON):
{"violated": true, "reason": "ihlal nedeni açıklaması", "action": "delete" | "warn" | "none"}

Analiz edilecek mesaj: "{text}"`);
  const [aiLoading, setAiLoading] = React.useState(false);

  React.useEffect(() => {
    if (settings?.settings) {
      try {
        const parsed = typeof settings.settings === 'string' ? JSON.parse(settings.settings) : settings.settings;
        if (parsed.aiProvider) setAiProvider(parsed.aiProvider);
        if (parsed.aiModel) setAiModel(parsed.aiModel);
        if (parsed.aiApiKey) setAiApiKey(parsed.aiApiKey);
        if (parsed.aiPrompt) setAiPrompt(parsed.aiPrompt);
        if (parsed.aiCustomUrl) setAiCustomUrl(parsed.aiCustomUrl);
      } catch (_) {}
    }
  }, [settings]);

  const handleProviderChange = (provider: string) => {
    setAiProvider(provider);
    if (provider === 'gemini') setAiModel('gemini-2.5-flash');
    else if (provider === 'openai') setAiModel('gpt-4o-mini');
    else if (provider === 'deepseek') setAiModel('deepseek-chat');
    else if (provider === 'claude') setAiModel('claude-3-5-haiku-20241022');
    else if (provider === 'local') setAiModel('custom-model');
  };

  const handleSaveAiSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setAiLoading(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            aiProvider,
            aiModel,
            aiApiKey,
            aiCustomUrl,
            aiPrompt
          }
        })
      });
      if (!response.ok) throw new Error('AI settings save failed.');
      toast.success(i18n.t('settings.saved'));
    } catch (err: any) {
      toast.error(err.message || 'Error occurred.');
    } finally {
      setAiLoading(false);
    }
  };

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
          { id: 'ai', label: i18n.t('settings.ai_tab'), icon: Sparkles },
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

        {activeTab === 'ai' && (
          <Card>
            <div className={flex({ align: 'center', gap: '2', mb: '6' })}>
              <div className={css({ p: '1.5', borderRadius: 'lg', bg: 'bgButtonSecondary', color: 'primary' })}><Sparkles size={18} /></div>
              <div className={css({ fontWeight: '600', color: 'textMain' })}>{i18n.t('settings.ai_tab_title')}</div>
            </div>

            <form onSubmit={handleSaveAiSettings} className={stack({ gap: '5' })}>
              <div className={css({ fontSize: 'xs', color: 'textMuted' })}>
                {i18n.t('settings.ai_desc')}
              </div>

              {/* Provider Selection */}
              <div className={stack({ gap: '1.5' })}>
                <label className={css({ fontSize: 'sm', fontWeight: '600', color: 'textMain' })}>{i18n.t('settings.ai_provider')}</label>
                <select value={aiProvider} onChange={e => handleProviderChange(e.target.value)}>
                  <option value="gemini">Google Gemini AI</option>
                  <option value="openai">OpenAI GPT</option>
                  <option value="deepseek">DeepSeek AI</option>
                  <option value="claude">Anthropic Claude</option>
                  <option value="local">Custom API / Local (Ollama)</option>
                </select>
              </div>

              {/* Model & API Key Grid */}
              <div className={flex({ gap: '4', flexDir: { base: 'column', sm: 'row' } })}>
                <div className={css({ flex: 1 })}>
                  <label className={css({ fontSize: 'sm', fontWeight: '600', color: 'textMain', display: 'block', mb: '1.5' })}>{i18n.t('settings.ai_model')}</label>
                  <Input
                    type="text"
                    value={aiModel}
                    onChange={e => setAiModel(e.target.value)}
                    placeholder="e.g. gemini-2.5-flash or gpt-4o-mini"
                  />
                </div>
                <div className={css({ flex: 1 })}>
                  <label className={css({ fontSize: 'sm', fontWeight: '600', color: 'textMain', display: 'block', mb: '1.5' })}>{i18n.t('settings.ai_api_key')}</label>
                  <Input
                    type="password"
                    value={aiApiKey}
                    onChange={e => setAiApiKey(e.target.value)}
                    placeholder={aiProvider === 'local' ? 'Optional for local endpoints' : 'API Key'}
                  />
                </div>
              </div>

              {/* Custom URL for Local/Ollama */}
              {aiProvider === 'local' && (
                <div className={stack({ gap: '1.5' })}>
                  <label className={css({ fontSize: 'sm', fontWeight: '600', color: 'textMain' })}>{i18n.t('settings.ai_custom_url')}</label>
                  <Input
                    type="text"
                    value={aiCustomUrl}
                    onChange={e => setAiCustomUrl(e.target.value)}
                    placeholder="http://localhost:11434/v1/chat/completions"
                  />
                </div>
              )}

              {/* System Prompt Template */}
              <div className={stack({ gap: '1.5' })}>
                <label className={css({ fontSize: 'sm', fontWeight: '600', color: 'textMain' })}>{i18n.t('settings.ai_prompt')}</label>
                <Textarea
                  value={aiPrompt}
                  onChange={e => setAiPrompt(e.target.value)}
                  rows={6}
                  className={css({ fontFamily: 'monospace', fontSize: 'xs' })}
                />
                <span className={css({ fontSize: '10px', color: 'textMuted' })}>
                  Mesaj içeriğinin yerleştirileceği alana <strong>{"{text}"}</strong> değişkenini eklemeyi unutmayın.
                </span>
              </div>

              {/* Action Buttons */}
              <div className={flex({ justify: 'flex-end', borderTop: '1px solid token(colors.borderMain)', pt: '4', mt: '2' })}>
                <Button type="submit" disabled={aiLoading}>
                  <Save size={18} /> {i18n.t('settings.submit') || 'Save'}
                </Button>
              </div>
            </form>
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
