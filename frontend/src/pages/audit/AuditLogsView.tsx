import { ChevronDown, ChevronLeft, ChevronRight, ClipboardList, Filter, Search, SortAsc, SortDesc, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { css } from '../../../styled-system/css';
import { hstack, stack } from '../../../styled-system/patterns';
import { auditApi } from '../../lib/api';
import type { AuditLog } from '../../types';

const ITEMS_PER_PAGE = 30;

export function AuditLogsView() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [availableActions, setAvailableActions] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const fetchLogs = async (p?: number) => {
    setLoading(true);
    try {
      const currentPage = p ?? page;
      const res = await auditApi.logs({
        limit: ITEMS_PER_PAGE,
        page: currentPage,
        search: search || undefined,
        action: actionFilter || undefined,
        sortBy,
        sortOrder,
      });
      setLogs(res.data.data);
      setTotal(res.data.pagination.total);
      setTotalPages(res.data.pagination.totalPages);
      setPage(res.data.pagination.page);
    } catch (e) {
      toast.error('Denetim logları yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const fetchActions = async () => {
    try {
      const res = await auditApi.actions();
      setAvailableActions(res.data);
    } catch (e) {}
  };

  useEffect(() => { fetchActions(); }, []);

  useEffect(() => {
    fetchLogs(1);
  }, [search, actionFilter, sortBy, sortOrder]);

  const handleSearch = () => {
    setSearch(searchInput.trim());
    setPage(1);
  };

  const clearSearch = () => {
    setSearchInput('');
    setSearch('');
    setPage(1);
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
  };

  const getActionColor = (action: string) => {
    if (action.includes('delete') || action.includes('ban') || action.includes('kick')) return '#ef4444';
    if (action.includes('create') || action.includes('update') || action.includes('login')) return '#22c55e';
    if (action.includes('api_call')) return '#3b82f6';
    return '#f59e0b';
  };

  const hasActiveFilters = search || actionFilter;

  return (
    <div className={stack({ gap: '5' })}>
      {/* Header */}
      <div className={hstack({ justify: 'space-between', alignItems: 'center' })}>
        <div>
          <h1 className={css({ fontSize: '2xl', fontWeight: 'bold', color: 'textMain' })}>
            Denetim Kayıtları
          </h1>
          <p className={css({ fontSize: 'sm', color: 'textMuted', mt: '1' })}>
            Tüm API çağrılarını ve yönetici işlemlerini görüntüleyin
            {total > 0 && (
              <span className={css({ ml: '2', color: 'textMuted' })}>
                (Toplam {total} kayıt)
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className={css({
        bg: 'bgSurface', borderRadius: 'xl',
        border: '1px solid token(colors.borderMain)',
        overflow: 'hidden',
      })}>
        {/* Search Bar */}
        <div className={css({ p: '3.5' })}>
          <div className={hstack({ gap: '3' })}>
            <div className={css({ position: 'relative', flex: 1 })}>
              <Search size={16} className={css({
                position: 'absolute', left: '3', top: '50%', transform: 'translateY(-50%)',
                color: 'textMuted',
              })} />
              <input
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="Ara: aksiyon, kullanıcı, IP, detay..."
                className={css({
                  w: 'full', pl: '10', pr: searchInput ? '10' : '4', py: '2.5', borderRadius: 'lg',
                  border: '1px solid token(colors.borderMain)',
                  bg: 'bgCanvas', color: 'textMain', fontSize: '14px',
                  outline: 'none',
                  _focus: { borderColor: 'primary', ring: '2px solid token(colors.primary)' },
                })}
              />
              {searchInput && (
                <button
                  onClick={() => setSearchInput('')}
                  className={css({
                    position: 'absolute', right: '3', top: '50%', transform: 'translateY(-50%)',
                    color: 'textMuted', cursor: 'pointer', bg: 'none', border: 'none', p: '0.5',
                    _hover: { color: 'textMain' },
                  })}
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <button
              onClick={handleSearch}
              className={css({
                px: '4', py: '2.5', borderRadius: 'lg',
                bg: 'primary', color: 'white', fontWeight: '600',
                fontSize: '13px', cursor: 'pointer',
                _hover: { bg: 'primaryHover' },
                border: 'none', whiteSpace: 'nowrap',
              })}
            >
              Ara
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={css({
                display: 'flex', alignItems: 'center', gap: '1.5',
                px: '3', py: '2.5', borderRadius: 'lg',
                bg: showFilters || hasActiveFilters ? 'rgba(239, 68, 68, 0.1)' : 'bgButtonSecondary',
                color: showFilters || hasActiveFilters ? 'primary' : 'textMain',
                fontWeight: '500', fontSize: '13px', cursor: 'pointer',
                border: showFilters || hasActiveFilters ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid token(colors.borderMain)',
                _hover: { bg: 'hoverBg' },
              })}
            >
              <Filter size={14} />
              Filtrele
              <ChevronDown size={12} className={css({
                transition: 'transform 0.2s',
                transform: showFilters ? 'rotate(180deg)' : 'rotate(0)',
              })} />
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className={css({
            borderTop: '1px solid token(colors.borderMain)',
            p: '3.5',
          })}>
            <div className={css({ display: 'flex', gap: '4', flexWrap: 'wrap', alignItems: 'flex-end' })}>
              {/* Action Filter */}
              <div>
                <label className={css({ display: 'block', fontSize: '10px', fontWeight: '600', color: 'textMuted', mb: '1', textTransform: 'uppercase' })}>
                  Aksiyon Türü
                </label>
                <select
                  value={actionFilter}
                  onChange={e => { setActionFilter(e.target.value); setPage(1); }}
                  className={css({
                    px: '3', py: '2', borderRadius: 'lg', minW: '160px',
                    border: '1px solid token(colors.borderMain)',
                    bg: 'bgCanvas', color: 'textMain', fontSize: '13px',
                    outline: 'none', cursor: 'pointer',
                  })}
                >
                  <option value="">Tümü</option>
                  {availableActions.map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>

              {/* Sort */}
              <div>
                <label className={css({ display: 'block', fontSize: '10px', fontWeight: '600', color: 'textMuted', mb: '1', textTransform: 'uppercase' })}>
                  Sıralama
                </label>
                <div className={hstack({ gap: '2' })}>
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                    className={css({
                      px: '3', py: '2', borderRadius: 'lg',
                      border: '1px solid token(colors.borderMain)',
                      bg: 'bgCanvas', color: 'textMain', fontSize: '13px',
                      outline: 'none', cursor: 'pointer',
                    })}
                  >
                    <option value="timestamp">Tarih</option>
                    <option value="action">Aksiyon</option>
                    <option value="username">Kullanıcı</option>
                  </select>
                  <button
                    onClick={toggleSortOrder}
                    className={css({
                      p: '2', borderRadius: 'lg', cursor: 'pointer',
                      border: '1px solid token(colors.borderMain)',
                      bg: 'bgCanvas', color: 'textMain',
                      _hover: { bg: 'hoverBg' },
                    })}
                    title={sortOrder === 'desc' ? 'En yeniden eskiye' : 'En eskiden yeniye'}
                  >
                    {sortOrder === 'desc' ? <SortDesc size={14} /> : <SortAsc size={14} />}
                  </button>
                </div>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <button
                  onClick={() => { setSearch(''); setSearchInput(''); setActionFilter(''); setPage(1); }}
                  className={css({
                    display: 'flex', alignItems: 'center', gap: '1',
                    px: '3', py: '2', borderRadius: 'lg',
                    color: '#ef4444', fontWeight: '500', fontSize: '12px',
                    cursor: 'pointer', bg: 'none', border: '1px solid rgba(239, 68, 68, 0.3)',
                    _hover: { bg: 'rgba(239, 68, 68, 0.05)' },
                  })}
                >
                  <X size={14} />
                  Filtreleri Temizle
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Logs List */}
      {loading ? (
        <div className={css({ textAlign: 'center', py: '12', color: 'textMuted' })}>
          Yükleniyor...
        </div>
      ) : logs.length === 0 ? (
        <div className={css({
          textAlign: 'center', py: '16', color: 'textMuted',
          bg: 'bgSurface', borderRadius: 'xl', border: '1px solid token(colors.borderMain)',
        })}>
          <ClipboardList size={40} className={css({ mx: 'auto', mb: '3', opacity: 0.3 })} />
          <p className={css({ fontSize: '16px', fontWeight: '600', mb: '1' })}>
            {hasActiveFilters ? 'Aramanızla eşleşen kayıt bulunamadı' : 'Henüz denetim kaydı bulunmuyor'}
          </p>
        </div>
      ) : (
        <>
          <div className={stack({ gap: '2' })}>
            {logs.map((log, idx) => (
              <div
                key={log.id || idx}
                className={css({
                  display: 'flex', alignItems: 'flex-start', gap: '3',
                  bg: 'bgSurface', borderRadius: 'lg', p: '3.5',
                  border: '1px solid token(colors.borderMain)',
                  transition: 'all 0.15s',
                  _hover: { borderColor: 'primary' },
                })}
              >
                {/* Action Badge */}
                <div className={css({
                  flexShrink: 0, w: '8', h: '8', borderRadius: 'lg',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  bg: `rgba(${getActionColor(log.action) === '#ef4444' ? '239, 68, 68' : getActionColor(log.action) === '#22c55e' ? '34, 197, 94' : getActionColor(log.action) === '#3b82f6' ? '59, 130, 246' : '245, 158, 11'}, 0.1)`,
                  color: getActionColor(log.action),
                  fontSize: '10px', fontWeight: '700', textTransform: 'uppercase',
                })}>
                  {log.action.slice(0, 3)}
                </div>

                {/* Content */}
                <div className={css({ flex: 1, minW: 0 })}>
                  <div className={css({ display: 'flex', alignItems: 'center', gap: '2', flexWrap: 'wrap' })}>
                    <span className={css({
                      px: '1.5', py: '0.5', borderRadius: 'sm',
                      fontSize: '11px', fontWeight: '700', fontFamily: 'monospace',
                      bg: `rgba(${getActionColor(log.action) === '#ef4444' ? '239, 68, 68' : getActionColor(log.action) === '#22c55e' ? '34, 197, 94' : getActionColor(log.action) === '#3b82f6' ? '59, 130, 246' : '245, 158, 11'}, 0.1)`,
                      color: getActionColor(log.action),
                    })}>
                      {log.action}
                    </span>
                    {log.username && (
                      <span className={css({ fontSize: '12px', fontWeight: '600', color: 'textMain' })}>
                        @{log.username}
                      </span>
                    )}
                    {log.ip && (
                      <span className={css({ fontSize: '11px', color: 'textMuted', fontFamily: 'monospace' })}>
                        {log.ip}
                      </span>
                    )}
                    <span className={css({ fontSize: '11px', color: 'textMuted', ml: 'auto' })}>
                      {new Date(log.timestamp).toLocaleString('tr-TR')}
                    </span>
                  </div>
                  {log.details && (
                    <p className={css({
                      fontSize: '12px', color: 'textMuted', mt: '1',
                      fontFamily: 'monospace', wordBreak: 'break-all',
                    })}>
                      {log.details}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className={hstack({
              justify: 'center', alignItems: 'center', gap: '2', pt: '4',
            })}>
              <button
                onClick={() => fetchLogs(page - 1)}
                disabled={page <= 1}
                className={css({
                  display: 'flex', alignItems: 'center', gap: '1',
                  px: '3', py: '2', borderRadius: 'lg',
                  bg: 'bgSurface', color: 'textMain', fontWeight: '500',
                  fontSize: '13px', cursor: 'pointer',
                  border: '1px solid token(colors.borderMain)',
                  _hover: { bg: 'hoverBg' },
                  _disabled: { opacity: 0.4, cursor: 'not-allowed' },
                })}
              >
                <ChevronLeft size={14} />
                Önceki
              </button>

              <div className={hstack({ gap: '1' })}>
                {generatePageNumbers(page, totalPages).map((p, idx) =>
                  p === '...' ? (
                    <span key={`dots-${idx}`} className={css({ px: '2', color: 'textMuted', fontSize: '13px' })}>...</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => fetchLogs(p as number)}
                      className={css({
                        w: '9', h: '9', borderRadius: 'lg',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: page === p ? '700' : '500',
                        fontSize: '13px', cursor: 'pointer',
                        bg: page === p ? 'primary' : 'bgSurface',
                        color: page === p ? 'white' : 'textMain',
                        border: page === p ? 'none' : '1px solid token(colors.borderMain)',
                        _hover: page !== p ? { bg: 'hoverBg' } : {},
                      })}
                    >
                      {p}
                    </button>
                  )
                )}
              </div>

              <button
                onClick={() => fetchLogs(page + 1)}
                disabled={page >= totalPages}
                className={css({
                  display: 'flex', alignItems: 'center', gap: '1',
                  px: '3', py: '2', borderRadius: 'lg',
                  bg: 'bgSurface', color: 'textMain', fontWeight: '500',
                  fontSize: '13px', cursor: 'pointer',
                  border: '1px solid token(colors.borderMain)',
                  _hover: { bg: 'hoverBg' },
                  _disabled: { opacity: 0.4, cursor: 'not-allowed' },
                })}
              >
                Sonraki
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function generatePageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | '...')[] = [];
  pages.push(1);

  if (current > 3) pages.push('...');

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push('...');

  pages.push(total);

  return pages;
}
