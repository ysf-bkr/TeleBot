import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { css } from '../../../styled-system/css';
import { stack } from '../../../styled-system/patterns';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { auth as authApi } from '../../lib/api';

export default function ForgotPasswordView() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return toast.error('E-posta adresinizi girin');
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
      toast.success('Şifre sıfırlama bağlantısı e-posta adresinize gönderildi');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'İşlem başarısız');
    }
    setLoading(false);
  };

  return (
    <div className={css({ minH: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', bg: 'bgCanvas', p: '4' })}>
      <Card className={css({ w: 'full', maxW: '400px', p: '8' })}>
        <div className={stack({ gap: '6' })}>
          <div className={css({ textAlign: 'center' })}>
            <div className={css({ fontSize: '3xl', mb: '2' })}>🔐</div>
            <h1 className={css({ fontSize: 'xl', fontWeight: 'bold' })}>Şifremi Unuttum</h1>
            <p className={css({ fontSize: 'sm', color: 'textMuted', mt: '1' })}>
              E-posta adresinizi girin, size sıfırlama bağlantısı gönderelim.
            </p>
          </div>

          {sent ? (
            <div className={stack({ gap: '4', align: 'center' })}>
              <div className={css({ p: '4', bg: 'success', color: 'white', borderRadius: 'lg', textAlign: 'center', fontSize: 'sm' })}>
                ✅ E-posta gönderildi!<br />
                Gelen kutunuzu kontrol edin.
              </div>
              <Button onClick={() => navigate('/login')}>Giriş Sayfasına Dön</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className={stack({ gap: '4' })}>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="E-posta adresiniz" required />
              <Button type="submit" disabled={loading} className={css({ w: 'full' })}>
                {loading ? 'Gönderiliyor...' : 'Sıfırlama Bağlantısı Gönder'}
              </Button>
              <button type="button" onClick={() => navigate('/login')}
                className={css({ fontSize: 'sm', color: 'primary', cursor: 'pointer', textAlign: 'center', border: 'none', bg: 'transparent' })}>
                Giriş sayfasına dön
              </button>
            </form>
          )}
        </div>
      </Card>
    </div>
  );
}
