import { Key, Plus, RefreshCw, Shield, Trash2, UserCheck, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { css } from '../../../styled-system/css';
import { flex, grid } from '../../../styled-system/patterns';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { PageHeader } from '../../components/ui/PageHeader';
import { Spinner } from '../../components/ui/Spinner';
import { audit as auditApi, usersApi } from '../../lib/api';
import { AuditLog } from '../../types';

export function TeamView() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [tab, setTab] = useState<'team' | 'audit'>('team');

  // Yeni kullanıcı modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('user');
  const [addingUser, setAddingUser] = useState(false);

  const fetchAudit = async () => {
    setLoading(true);
    try {
      const res = await auditApi.logs({ limit: 30 });
      const data = res.data as any;
      setAuditLogs(Array.isArray(data) ? data : (data.logs || []));
    } catch (e) {
      toast.error('Audit logları yüklenemedi');
      setAuditLogs([]);
    }
    setLoading(false);
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await usersApi.list();
      setUsers(res.data);
    } catch (e) {
      toast.error('Kullanıcılar yüklenemedi');
      setUsers([]);
    }
    setLoadingUsers(false);
  };

  useEffect(() => {
    fetchAudit();
    fetchUsers();
  }, []);

  const handleUpdateRole = async (id: number, role: string) => {
    try {
      await usersApi.updateRole(id, role);
      toast.success('Kullanıcı rolü güncellendi');
      fetchUsers();
    } catch (e) {
      toast.error('Rol güncellenemedi');
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newPassword) {
      toast.error('Kullanıcı adı ve şifre zorunludur');
      return;
    }
    setAddingUser(true);
    try {
      await usersApi.create({ username: newUsername, password: newPassword, role: newRole });
      toast.success('Kullanıcı başarıyla eklendi');
      setShowAddModal(false);
      setNewUsername('');
      setNewPassword('');
      setNewRole('user');
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Kullanıcı eklenemedi');
    }
    setAddingUser(false);
  };

  const handleDeleteUser = async (id: number, username: string) => {
    if (!confirm(`${username} kullanıcısını silmek istediğinize emin misiniz?`)) return;
    try {
      await usersApi.delete(id);
      toast.success('Kullanıcı silindi');
      fetchUsers();
    } catch (e) {
      toast.error('Kullanıcı silinemedi');
    }
  };

  return (
    <div className={css({ display: 'flex', flexDirection: 'column', gap: '6', color: 'textMain' })}>
      <PageHeader
        title="Ekip & RBAC"
        description="Yönetici ekibi, rol tabanlı erişim ve tam denetim kayıtları (Audit)"
        icon={<Users size={26} />}
      />

      {/* Tab Bar */}
      <div className={flex({ gap: '1', borderBottom: '1px solid token(colors.borderMain)', pb: '2' })}>
        {[
          { id: 'team', label: 'Ekip Üyeleri', icon: Users },
          { id: 'audit', label: 'Denetim Kayıtları', icon: Shield },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className={css({
              display: 'flex', alignItems: 'center', gap: '2', px: '4', py: '2.5', borderRadius: 'lg', fontSize: 'sm',
              fontWeight: tab === t.id ? '600' : '500', bg: tab === t.id ? 'primary' : 'transparent',
              color: tab === t.id ? 'white' : 'textMain', cursor: 'pointer', border: 'none',
              transition: 'all 0.15s ease',
              _hover: { bg: tab === t.id ? 'primaryHover' : 'bgButtonSecondary' }
            })}>
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'team' && (
        <>
          {/* Info cards */}
          <div className={grid({ columns: { base: 1, md: 3 }, gap: '4' })}>
            <Card>
              <div className={flex({ gap: '3', align: 'center' })}>
                <div className={css({ p: '2', bg: 'bgButtonSecondary', borderRadius: 'lg', color: 'primary' })}>
                  <Users size={20} />
                </div>
                <div>
                  <div className={css({ fontWeight: '600' })}>Toplam Kullanıcı</div>
                  <div className={css({ fontSize: '2xl', fontWeight: 'bold' })}>{users.length}</div>
                </div>
              </div>
            </Card>
            <Card>
              <div className={flex({ gap: '3', align: 'center' })}>
                <div className={css({ p: '2', bg: 'bgButtonSecondary', borderRadius: 'lg', color: 'primary' })}>
                  <Key size={20} />
                </div>
                <div>
                  <div className={css({ fontWeight: '600' })}>Adminler</div>
                  <div className={css({ fontSize: '2xl', fontWeight: 'bold' })}>
                    {users.filter(u => u.role === 'admin').length}
                  </div>
                </div>
              </div>
            </Card>
            <Card>
              <div className={flex({ gap: '3', align: 'center' })}>
                <div className={css({ p: '2', bg: 'bgButtonSecondary', borderRadius: 'lg', color: 'primary' })}>
                  <UserCheck size={20} />
                </div>
                <div>
                  <div className={css({ fontWeight: '600' })}>Moderatörler</div>
                  <div className={css({ fontSize: '2xl', fontWeight: 'bold' })}>
                    {users.filter(u => u.role === 'moderator').length}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Kullanıcı Listesi ve Rol Yönetimi */}
          <Card>
            <div className={flex({ justify: 'space-between', align: 'center', mb: '4' })}>
              <h2 className={css({ fontWeight: '600', fontSize: 'lg' })}>Panel Kullanıcıları</h2>
              <div className={flex({ gap: '2' })}>
                <Button size="sm" variant="secondary" onClick={() => setShowAddModal(true)}>
                  <Plus size={14} /> Kullanıcı Ekle
                </Button>
                <Button size="sm" variant="secondary" onClick={fetchUsers} disabled={loadingUsers}>
                  <RefreshCw size={16} className={css({ animation: loadingUsers ? 'spin 1s linear infinite' : 'none' })} />
                </Button>
              </div>
            </div>
            {loadingUsers ? <Spinner /> : users.length === 0 ? (
              <div className={css({ p: '6', textAlign: 'center', color: 'textMuted', fontSize: 'sm' })}>
                Henüz kayıtlı kullanıcı yok. "Kullanıcı Ekle" butonuna tıklayarak ekleyin.
              </div>
            ) : (
              <div className={css({ overflowX: 'auto' })}>
                <table className={css({ w: 'full', fontSize: 'sm', minWidth: '700px' })}>
                  <thead className={css({ bg: 'bgCanvas' })}>
                    <tr>
                      <th className={css({ textAlign: 'left', p: '3', borderBottom: '1px solid token(colors.borderMain)' })}>Kullanıcı</th>
                      <th className={css({ textAlign: 'left', p: '3', borderBottom: '1px solid token(colors.borderMain)' })}>Rol</th>
                      <th className={css({ textAlign: 'left', p: '3', borderBottom: '1px solid token(colors.borderMain)' })}>Kayıt Tarihi</th>
                      <th className={css({ textAlign: 'right', p: '3', borderBottom: '1px solid token(colors.borderMain)' })}>İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u: any) => (
                      <tr key={u.id} className={css({ borderBottom: '1px solid token(colors.borderMain)', _hover: { bg: 'bgCanvas' } })}>
                        <td className={css({ p: '3', fontWeight: '500' })}>{u.username}</td>
                        <td className={css({ p: '3' })}>
                          <Badge variant={u.role === 'admin' ? 'success' : u.role === 'moderator' ? 'warning' : 'neutral'}>
                            {u.role === 'admin' ? 'Admin' : u.role === 'moderator' ? 'Moderatör' : 'Kullanıcı'}
                          </Badge>
                        </td>
                        <td className={css({ p: '3', color: 'textMuted', fontSize: 'xs' })}>
                          {u.created_at ? new Date(u.created_at).toLocaleDateString('tr-TR') : '-'}
                        </td>
                        <td className={css({ p: '3', textAlign: 'right' })}>
                          <div className={flex({ gap: '2', justify: 'flex-end', align: 'center' })}>
                            <select
                              value={u.role || 'user'}
                              onChange={e => handleUpdateRole(u.id, e.target.value)}
                              className={css({ px: '2', py: '1.5', bg: 'bgSurface', border: '1px solid token(colors.borderMain)', borderRadius: 'lg', fontSize: 'sm', color: 'textMain', outline: 'none', cursor: 'pointer' })}
                            >
                              <option value="user">Kullanıcı</option>
                              <option value="moderator">Moderatör</option>
                              <option value="admin">Admin</option>
                            </select>
                            <button
                              onClick={() => handleDeleteUser(u.id, u.username)}
                              className={css({ p: '1.5', borderRadius: 'md', color: 'danger', cursor: 'pointer', _hover: { bg: 'rgba(220,38,38,0.1)' }, border: 'none', bg: 'transparent' })}
                              title="Kullanıcıyı Sil"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}

      {tab === 'audit' && (
        <Card>
          <div className={flex({ justify: 'space-between', align: 'center', mb: '4' })}>
            <h2 className={css({ fontWeight: '600', fontSize: 'lg' })}>Son Audit Kayıtları</h2>
            <Button size="sm" variant="secondary" onClick={fetchAudit} disabled={loading}>
              <RefreshCw size={16} className={css({ animation: loading ? 'spin 1s linear infinite' : 'none' })} /> Yenile
            </Button>
          </div>
          {auditLogs.length === 0 ? (
            <div className={css({ p: '6', textAlign: 'center', color: 'textMuted', fontSize: 'sm' })}>
              Henüz audit kaydı yok. Yazma işlemleri (POST/PATCH/DELETE) loglanacaktır.
            </div>
          ) : (
            <div className={css({ overflowX: 'auto', WebkitOverflowScrolling: 'touch' })}>
              <table className={css({ width: 'full', fontSize: 'sm', borderCollapse: 'collapse', minWidth: '680px' })}>
                <thead>
                  <tr className={css({ borderBottom: '1px solid', borderColor: 'borderMain', color: 'textMuted', textAlign: 'left' })}>
                    <th className={css({ py: '2', px: '3' })}>Zaman</th>
                    <th className={css({ py: '2', px: '3' })}>Kullanıcı</th>
                    <th className={css({ py: '2', px: '3' })}>İşlem</th>
                    <th className={css({ py: '2', px: '3' })}>Detay</th>
                    <th className={css({ py: '2', px: '3' })}>IP</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log, i) => (
                    <tr key={i} className={css({ borderBottom: '1px solid', borderColor: 'borderMain' })}>
                      <td className={css({ py: '2.5', px: '3', color: 'textMuted', fontSize: 'xs', whiteSpace: 'nowrap' })}>
                        {log.timestamp ? new Date(log.timestamp).toLocaleString('tr-TR') : '-'}
                      </td>
                      <td className={css({ py: '2.5', px: '3', fontWeight: '500' })}>
                        {log.username || log.user_id || 'Sistem'}
                      </td>
                      <td className={css({ py: '2.5', px: '3' })}>
                        <Badge variant="neutral">{log.action}</Badge>
                      </td>
                      <td className={css({ py: '2.5', px: '3', fontFamily: 'monospace', fontSize: 'xs', maxW: '320px', overflow: 'hidden', textOverflow: 'ellipsis' })}>
                        {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                      </td>
                      <td className={css({ py: '2.5', px: '3', fontSize: 'xs', color: 'textMuted' })}>
                        {log.ip || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Kullanıcı Ekle Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Yeni Kullanıcı Ekle"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>İptal</Button>
            <Button onClick={handleAddUser} disabled={addingUser}>
              {addingUser ? 'Ekleniyor...' : 'Kullanıcı Ekle'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleAddUser} className={css({ display: 'flex', flexDirection: 'column', gap: '4' })}>
          <div>
            <label className={css({ display: 'block', fontSize: 'sm', fontWeight: '500', mb: '1.5', color: 'textMain' })}>Kullanıcı Adı</label>
            <Input
              value={newUsername}
              onChange={e => setNewUsername(e.target.value)}
              placeholder="ornek@email.com"
              required
            />
          </div>
          <div>
            <label className={css({ display: 'block', fontSize: 'sm', fontWeight: '500', mb: '1.5', color: 'textMain' })}>Şifre</label>
            <Input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="En az 6 karakter"
              required
              minLength={6}
            />
          </div>
          <div>
            <label className={css({ display: 'block', fontSize: 'sm', fontWeight: '500', mb: '1.5', color: 'textMain' })}>Rol</label>
            <select
              value={newRole}
              onChange={e => setNewRole(e.target.value)}
              className={css({ w: 'full', px: '3', py: '2.5', bg: 'bgSurface', border: '1px solid token(colors.borderMain)', borderRadius: 'lg', fontSize: 'sm', color: 'textMain', outline: 'none', cursor: 'pointer' })}
            >
              <option value="user">Kullanıcı</option>
              <option value="moderator">Moderatör</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default TeamView;
