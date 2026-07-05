import { Plus, Power, Terminal, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { css } from '../../../styled-system/css';
import { hstack, stack } from '../../../styled-system/patterns';
import { commandsApi } from '../../lib/api';
import type { CustomCommand } from '../../types';

export function CommandsView() {
  const [commands, setCommands] = useState<CustomCommand[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newCommand, setNewCommand] = useState('');
  const [newResponse, setNewResponse] = useState('');

  const fetchCommands = async () => {
    try {
      const res = await commandsApi.list();
      setCommands(res.data);
    } catch (e) {
      toast.error('Komutlar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCommands(); }, []);

  const handleCreate = async () => {
    if (!newCommand.trim() || !newResponse.trim()) {
      toast.error('Komut adı ve yanıt zorunludur');
      return;
    }
    try {
      await commandsApi.create({ command: newCommand.trim(), response: newResponse.trim() });
      toast.success('Komut oluşturuldu');
      setNewCommand('');
      setNewResponse('');
      setShowForm(false);
      fetchCommands();
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Komut oluşturulamadı');
    }
  };

  const handleToggle = async (cmd: CustomCommand) => {
    try {
      await commandsApi.toggle(cmd.id, !cmd.is_active);
      toast.success(`Komut ${cmd.is_active ? 'devre dışı' : 'aktif'}`);
      fetchCommands();
    } catch (e) {
      toast.error('Komut durumu değiştirilemedi');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bu komutu silmek istediğinize emin misiniz?')) return;
    try {
      await commandsApi.delete(id);
      toast.success('Komut silindi');
      fetchCommands();
    } catch (e) {
      toast.error('Komut silinemedi');
    }
  };

  return (
    <div className={stack({ gap: '6' })}>
      {/* Header */}
      <div className={hstack({ justify: 'space-between', alignItems: 'center' })}>
        <div>
          <h1 className={css({ fontSize: '2xl', fontWeight: 'bold', color: 'textMain' })}>
            Özel Komutlar
          </h1>
          <p className={css({ fontSize: 'sm', color: 'textMuted', mt: '1' })}>
            Telegram botunuz için özel /komutlar tanımlayın
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={css({
            display: 'flex', alignItems: 'center', gap: '2',
            px: '4', py: '2.5', borderRadius: 'lg',
            bg: 'primary', color: 'white', fontWeight: '600',
            fontSize: '13px', cursor: 'pointer',
            _hover: { bg: 'primaryHover' },
            border: 'none',
          })}
        >
          <Plus size={16} />
          Yeni Komut
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className={css({
          bg: 'bgSurface', borderRadius: 'xl', p: '5',
          border: '1px solid token(colors.borderMain)',
          spaceY: '4',
        })}>
          <div>
            <label className={css({ display: 'block', fontSize: '12px', fontWeight: '600', color: 'textMuted', mb: '1' })}>
              Komut (slashesiz)
            </label>
            <div className={css({ display: 'flex', alignItems: 'center', gap: '2' })}>
              <span className={css({ color: 'textMuted', fontWeight: 'bold', fontSize: '16px' })}>/</span>
              <input
                value={newCommand}
                onChange={e => setNewCommand(e.target.value)}
                placeholder="ornekkomut"
                className={css({
                  flex: 1, px: '3', py: '2', borderRadius: 'lg',
                  border: '1px solid token(colors.borderMain)',
                  bg: 'bgCanvas', color: 'textMain', fontSize: '14px',
                  outline: 'none',
                  _focus: { borderColor: 'primary', ring: '2px solid token(colors.primary)' },
                })}
              />
            </div>
          </div>
          <div>
            <label className={css({ display: 'block', fontSize: '12px', fontWeight: '600', color: 'textMuted', mb: '1' })}>
              Yanıt Mesajı
            </label>
            <textarea
              value={newResponse}
              onChange={e => setNewResponse(e.target.value)}
              placeholder="Komut çalıştırıldığında gönderilecek mesaj..."
              rows={3}
              className={css({
                w: 'full', px: '3', py: '2', borderRadius: 'lg',
                border: '1px solid token(colors.borderMain)',
                bg: 'bgCanvas', color: 'textMain', fontSize: '14px',
                outline: 'none', resize: 'vertical',
                _focus: { borderColor: 'primary', ring: '2px solid token(colors.primary)' },
              })}
            />
          </div>
          <div className={hstack({ gap: '3' })}>
            <button
              onClick={handleCreate}
              className={css({
                px: '5', py: '2.5', borderRadius: 'lg',
                bg: 'primary', color: 'white', fontWeight: '600',
                fontSize: '13px', cursor: 'pointer',
                _hover: { bg: 'primaryHover' },
                border: 'none',
              })}
            >
              Komutu Oluştur
            </button>
            <button
              onClick={() => setShowForm(false)}
              className={css({
                px: '5', py: '2.5', borderRadius: 'lg',
                bg: 'bgButtonSecondary', color: 'textMain', fontWeight: '500',
                fontSize: '13px', cursor: 'pointer',
                border: '1px solid token(colors.borderMain)',
                _hover: { bg: 'hoverBg' },
              })}
            >
              İptal
            </button>
          </div>
        </div>
      )}

      {/* Commands List */}
      {loading ? (
        <div className={css({ textAlign: 'center', py: '12', color: 'textMuted' })}>
          Yükleniyor...
        </div>
      ) : commands.length === 0 ? (
        <div className={css({
          textAlign: 'center', py: '16', color: 'textMuted',
          bg: 'bgSurface', borderRadius: 'xl', border: '1px solid token(colors.borderMain)',
        })}>
          <Terminal size={40} className={css({ mx: 'auto', mb: '3', opacity: 0.3 })} />
          <p className={css({ fontSize: '16px', fontWeight: '600', mb: '1' })}>Henüz komut eklenmemiş</p>
          <p className={css({ fontSize: '13px' })}>Botunuza özel komutlar ekleyerek otomatik yanıtlar oluşturun.</p>
        </div>
      ) : (
        <div className={stack({ gap: '3' })}>
          {commands.map(cmd => (
            <div
              key={cmd.id}
              className={css({
                display: 'flex', alignItems: 'center', gap: '4',
                bg: 'bgSurface', borderRadius: 'xl', p: '4',
                border: '1px solid token(colors.borderMain)',
                transition: 'all 0.2s',
                opacity: cmd.is_active ? 1 : 0.5,
                _hover: { borderColor: 'primary' },
              })}
            >
              {/* Command */}
              <div className={css({ flex: 1 })}>
                <div className={css({ display: 'flex', alignItems: 'center', gap: '2', mb: '1' })}>
                  <span className={css({
                    display: 'inline-flex', px: '2', py: '0.5', borderRadius: 'md',
                    bg: 'rgba(239, 68, 68, 0.1)', color: 'primary',
                    fontSize: '12px', fontWeight: '700', fontFamily: 'monospace',
                  })}>
                    /{cmd.command}
                  </span>
                  <span className={css({
                    px: '2', py: '0.5', borderRadius: 'full',
                    fontSize: '10px', fontWeight: '600',
                    bg: cmd.is_active ? 'rgba(34, 197, 94, 0.1)' : 'rgba(156, 163, 175, 0.2)',
                    color: cmd.is_active ? '#22c55e' : '#9ca3af',
                  })}>
                    {cmd.is_active ? 'Aktif' : 'Pasif'}
                  </span>
                </div>
                <p className={css({ fontSize: '13px', color: 'textMuted', lineClamp: 2 })}>
                  {cmd.response}
                </p>
              </div>

              {/* Actions */}
              <div className={hstack({ gap: '2' })}>
                <button
                  onClick={() => handleToggle(cmd)}
                  className={css({
                    p: '2', borderRadius: 'lg', cursor: 'pointer',
                    border: 'none',
                    bg: cmd.is_active ? 'rgba(34, 197, 94, 0.1)' : 'rgba(156, 163, 175, 0.2)',
                    color: cmd.is_active ? '#22c55e' : '#9ca3af',
                    _hover: { opacity: 0.8 },
                  })}
                  title={cmd.is_active ? 'Devre dışı bırak' : 'Aktifleştir'}
                >
                  <Power size={16} />
                </button>
                <button
                  onClick={() => handleDelete(cmd.id)}
                  className={css({
                    p: '2', borderRadius: 'lg', cursor: 'pointer',
                    bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444',
                    border: 'none',
                    _hover: { opacity: 0.8 },
                  })}
                  title="Sil"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
