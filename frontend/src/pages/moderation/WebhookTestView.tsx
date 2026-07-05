import { CheckCircle, Clock, Globe, Send, XCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { css } from '../../../styled-system/css';
import { hstack, stack } from '../../../styled-system/patterns';
import { webhookApi } from '../../lib/api';

export function WebhookTestView() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    statusCode?: number;
    duration?: string;
    response?: string;
  } | null>(null);

  const handleTest = async () => {
    if (!url.trim()) {
      toast.error('Webhook URL giriniz');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await webhookApi.test(url.trim());
      setResult(res.data);
      if (res.data.success) {
        toast.success('Webhook başarıyla test edildi');
      } else {
        toast.error('Webhook yanıt vermedi');
      }
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Webhook testi başarısız');
      setResult({ success: false });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={stack({ gap: '6' })}>
      {/* Header */}
      <div>
        <h1 className={css({ fontSize: '2xl', fontWeight: 'bold', color: 'textMain' })}>
          Webhook Test
        </h1>
        <p className={css({ fontSize: 'sm', color: 'textMuted', mt: '1' })}>
          Harici webhook URL'lerinizi test edin ve yanıt sürelerini görüntüleyin
        </p>
      </div>

      {/* Test Form */}
      <div className={css({
        bg: 'bgSurface', borderRadius: 'xl', p: '5',
        border: '1px solid token(colors.borderMain)',
        spaceY: '4',
      })}>
        <div>
          <label className={css({ display: 'block', fontSize: '12px', fontWeight: '600', color: 'textMuted', mb: '1' })}>
            Webhook URL
          </label>
          <div className={hstack({ gap: '3' })}>
            <div className={css({ position: 'relative', flex: 1 })}>
              <Globe size={16} className={css({
                position: 'absolute', left: '3', top: '50%', transform: 'translateY(-50%)',
                color: 'textMuted',
              })} />
              <input
                value={url}
                onChange={e => setUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleTest()}
                placeholder="https://example.com/webhook"
                className={css({
                  w: 'full', pl: '10', pr: '4', py: '2.5', borderRadius: 'lg',
                  border: '1px solid token(colors.borderMain)',
                  bg: 'bgCanvas', color: 'textMain', fontSize: '14px',
                  outline: 'none',
                  _focus: { borderColor: 'primary', ring: '2px solid token(colors.primary)' },
                })}
              />
            </div>
            <button
              onClick={handleTest}
              disabled={loading}
              className={css({
                display: 'flex', alignItems: 'center', gap: '2',
                px: '5', py: '2.5', borderRadius: 'lg',
                bg: 'primary', color: 'white', fontWeight: '600',
                fontSize: '13px', cursor: 'pointer',
                _hover: { bg: 'primaryHover' },
                _disabled: { opacity: 0.5, cursor: 'not-allowed' },
                border: 'none',
              })}
            >
              <Send size={16} />
              {loading ? 'Test Ediliyor...' : 'Test Et'}
            </button>
          </div>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className={css({
          bg: 'bgSurface', borderRadius: 'xl', p: '5',
          border: '1px solid token(colors.borderMain)',
          spaceY: '4',
        })}>
          <h2 className={css({ fontSize: '16px', fontWeight: '600', color: 'textMain' })}>
            Test Sonucu
          </h2>

          <div className={css({ display: 'grid', gridTemplateColumns: { base: '1fr 1fr', md: 'repeat(3, 1fr)' }, gap: '4' })}>
            {/* Status */}
            <div className={css({
              bg: 'bgCanvas', borderRadius: 'lg', p: '3.5',
              border: '1px solid token(colors.borderMain)',
            })}>
              <div className={css({ display: 'flex', alignItems: 'center', gap: '2', mb: '1' })}>
                {result.success ? (
                  <CheckCircle size={14} className={css({ color: '#22c55e' })} />
                ) : (
                  <XCircle size={14} className={css({ color: '#ef4444' })} />
                )}
                <span className={css({ fontSize: '11px', color: 'textMuted', fontWeight: '600' })}>Durum</span>
              </div>
              <span className={css({
                fontSize: '14px', fontWeight: 'bold',
                color: result.success ? '#22c55e' : '#ef4444',
              })}>
                {result.success ? 'Başarılı' : 'Başarısız'}
              </span>
            </div>

            {/* Status Code */}
            {result.statusCode && (
              <div className={css({
                bg: 'bgCanvas', borderRadius: 'lg', p: '3.5',
                border: '1px solid token(colors.borderMain)',
              })}>
                <div className={css({ display: 'flex', alignItems: 'center', gap: '2', mb: '1' })}>
                  <Globe size={14} className={css({ color: '#3b82f6' })} />
                  <span className={css({ fontSize: '11px', color: 'textMuted', fontWeight: '600' })}>HTTP Kodu</span>
                </div>
                <span className={css({
                  fontSize: '14px', fontWeight: 'bold', color: 'textMain',
                  fontFamily: 'monospace',
                })}>
                  {result.statusCode}
                </span>
              </div>
            )}

            {/* Duration */}
            {result.duration && (
              <div className={css({
                bg: 'bgCanvas', borderRadius: 'lg', p: '3.5',
                border: '1px solid token(colors.borderMain)',
              })}>
                <div className={css({ display: 'flex', alignItems: 'center', gap: '2', mb: '1' })}>
                  <Clock size={14} className={css({ color: '#f59e0b' })} />
                  <span className={css({ fontSize: '11px', color: 'textMuted', fontWeight: '600' })}>Yanıt Süresi</span>
                </div>
                <span className={css({
                  fontSize: '14px', fontWeight: 'bold', color: 'textMain',
                  fontFamily: 'monospace',
                })}>
                  {result.duration}
                </span>
              </div>
            )}
          </div>

          {/* Response Body */}
          {result.response && (
            <div>
              <label className={css({ display: 'block', fontSize: '12px', fontWeight: '600', color: 'textMuted', mb: '1' })}>
                Yanıt İçeriği
              </label>
              <pre className={css({
                bg: 'bgCanvas', borderRadius: 'lg', p: '3.5',
                border: '1px solid token(colors.borderMain)',
                fontSize: '12px', color: 'textMuted',
                fontFamily: 'monospace', whiteSpace: 'pre-wrap',
                wordBreak: 'break-all', maxH: '200px', overflowY: 'auto',
              })}>
                {result.response}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Info */}
      <div className={css({
        bg: 'rgba(59, 130, 246, 0.05)', borderRadius: 'xl', p: '4',
        border: '1px solid rgba(59, 130, 246, 0.2)',
        fontSize: '12px', color: 'textMuted',
      })}>
        <strong className={css({ color: '#3b82f6' })}>Bilgi:</strong> Test sırasında URL'e bir POST isteği gönderilir.
        Webhook'unuzun doğru çalıştığından emin olmak için kullanabilirsiniz.
      </div>
    </div>
  );
}
