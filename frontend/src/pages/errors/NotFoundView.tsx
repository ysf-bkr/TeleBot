import { ArrowLeft, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { css } from '../../../styled-system/css';
import { stack } from '../../../styled-system/patterns';
import { Button } from '../../components/ui/Button';

export default function NotFoundView() {
  const navigate = useNavigate();

  return (
    <div className={css({
      minH: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      bg: 'bgCanvas', p: '4'
    })}>
      <div className={stack({ gap: '6', align: 'center', maxW: 'md' })}>
        <div className={css({ fontSize: '8xl', fontWeight: 'bold', color: 'primary', lineHeight: '1' })}>404</div>
        <h1 className={css({ fontSize: '2xl', fontWeight: 'bold', textAlign: 'center' })}>Sayfa Bulunamadı</h1>
        <p className={css({ fontSize: 'sm', color: 'textMuted', textAlign: 'center' })}>
          Aradığınız sayfa mevcut değil veya taşınmış olabilir. Lütfen adresi kontrol edin.
        </p>
        <div className={css({ display: 'flex', gap: '3' })}>
          <Button onClick={() => navigate(-1)} variant="secondary">
            <ArrowLeft size={16} /> Geri Dön
          </Button>
          <Button onClick={() => navigate('/dashboard')}>
            <Home size={16} /> Ana Sayfa
          </Button>
        </div>
      </div>
    </div>
  );
}
