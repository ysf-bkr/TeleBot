import { Chart, registerables } from 'chart.js';
import { Activity, BarChart, RefreshCw, TrendingUp, Users } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { css } from '../../../styled-system/css';
import { flex, grid } from '../../../styled-system/patterns';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import { Spinner } from '../../components/ui/Spinner';
import { analytics as analyticsApi, chatsApi } from '../../lib/api';
import { Chat } from '../../types';

Chart.register(...registerables);

function MetricChart({ label, value, color = '#ef4444', max }: { label: string; value: number; color?: string; max?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    if (chartRef.current) chartRef.current.destroy();
    chartRef.current = new Chart(canvasRef.current, {
      type: 'doughnut',
      data: {
        labels: [label, 'Kalan'],
        datasets: [{
          data: [value, Math.max(0, (max || 100) - value)],
          backgroundColor: [color, '#f1f5f9'],
          borderWidth: 0,
        }]
      },
      options: {
        cutout: '70%',
        plugins: { legend: { display: false } },
        responsive: true,
        maintainAspectRatio: true,
      }
    });
    return () => { if (chartRef.current) chartRef.current.destroy(); };
  }, [value, color, max]);

  return (
    <div className={css({ textAlign: 'center', p: '2' })}>
      <canvas ref={canvasRef} className={css({ w: '100px', h: '100px', mx: 'auto' })} />
      <div className={css({ fontSize: '2xl', fontWeight: 'bold', mt: '1' })}>{value.toLocaleString('tr-TR')}</div>
      <div className={css({ fontSize: 'xs', color: 'textMuted' })}>{label}</div>
    </div>
  );
}

function BarChartComponent({ data, label, color = '#ef4444' }: { data: { label: string; value: number }[]; label: string; color?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current || data.length === 0) return;
    if (chartRef.current) chartRef.current.destroy();
    chartRef.current = new Chart(canvasRef.current, {
      type: 'bar',
      data: {
        labels: data.map(d => d.label),
        datasets: [{
          label,
          data: data.map(d => d.value),
          backgroundColor: color,
          borderRadius: 6,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
          x: { grid: { display: false } }
        }
      }
    });
    return () => { if (chartRef.current) chartRef.current.destroy(); };
  }, [data, label, color]);

  if (data.length === 0) return null;
  return (
    <div className={css({ h: '250px' })}>
      <canvas ref={canvasRef} />
    </div>
  );
}

export function AnalyticsView({ chats = [] }: { chats: Chat[] }) {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [days, setDays] = useState(7);
  const [report, setReport] = useState<any>(null);
  const [loadingReport, setLoadingReport] = useState(false);

  const activeChats = chats.filter((c: Chat) => c.is_enabled);

  const fetchMetrics = async (chatId: string) => {
    if (!chatId) return;
    setLoading(true);
    try {
      const res = await analyticsApi.metrics(chatId, days);
      setMetrics(res.data.metrics || res.data);
    } catch (e) {
      toast.error('Analitik verileri alınamadı');
      setMetrics(null);
    }
    setLoading(false);
  };

  const fetchReport = async (chatId: string) => {
    if (!chatId) return;
    setLoadingReport(true);
    try {
      const res = await chatsApi.reports(chatId, days);
      setReport(res.data);
    } catch (e) {
      setReport(null);
    }
    setLoadingReport(false);
  };

  useEffect(() => {
    if (activeChats.length > 0 && !selectedChatId) {
      setSelectedChatId(activeChats[0].chat_id);
    }
  }, [chats]);

  useEffect(() => {
    if (selectedChatId) {
      fetchMetrics(selectedChatId);
      fetchReport(selectedChatId);
    }
  }, [selectedChatId, days]);

  const activeCount = chats.length;
  const activeGroups = activeChats.length;

  // Chart verileri
  const topUsers = report?.topUsers?.map((u: any) => ({ label: u.first_name || u.username || 'Bilinmeyen', value: Number(u.message_count) })) || [];
  const modActions = report?.moderationActions?.map((m: any) => ({ label: m.action, value: Number(m.count) })) || [];

  return (
    <div className={css({ display: 'flex', flexDirection: 'column', gap: '6', color: 'textMain' })}>
      <PageHeader
        title="Grup Analitiği"
        description="Her grup için ayrı grafikler ve metrikler"
        icon={<BarChart size={26} />}
        actions={
          <Button size="sm" variant="secondary" onClick={() => selectedChatId && fetchMetrics(selectedChatId)} disabled={loading}>
            <RefreshCw size={16} className={css({ animation: loading ? 'spin 1s linear infinite' : 'none' })} />
          </Button>
        }
      />

      {/* Global summary */}
      <div className={grid({ columns: { base: 2, md: 4 }, gap: '4' })}>
        <Card><div className={flex({ align: 'center', gap: '3' })}>
          <Users className={css({ color: 'primary' })} />
          <div><div className={css({ fontSize: 'xs', color: 'textMuted' })}>Toplam Grup</div><div className={css({ fontSize: '2xl', fontWeight: 'bold' })}>{activeCount}</div></div>
        </div></Card>
        <Card><div className={flex({ align: 'center', gap: '3' })}>
          <Activity className={css({ color: 'primary' })} />
          <div><div className={css({ fontSize: 'xs', color: 'textMuted' })}>Aktif Grup</div><div className={css({ fontSize: '2xl', fontWeight: 'bold' })}>{activeGroups}</div></div>
        </div></Card>
        <Card><div className={flex({ align: 'center', gap: '3' })}>
          <TrendingUp className={css({ color: 'primary' })} />
          <div><div className={css({ fontSize: 'xs', color: 'textMuted' })}>Toplam Mesaj</div><div className={css({ fontSize: '2xl', fontWeight: 'bold' })}>{report?.totalMessages || '-'}</div></div>
        </div></Card>
        <Card>
          <div><div className={css({ fontSize: 'xs', color: 'textMuted', mb: '1' })}>Zaman</div>
            <div className={flex({ gap: '1' })}>
              {[1, 7, 30].map(d => (
                <button key={d} onClick={() => setDays(d)}
                  className={css({ px: '2.5', py: '1', fontSize: 'xs', borderRadius: 'md', borderWidth: '1px', borderStyle: 'solid',
                    borderColor: days === d ? 'primary' : 'borderMain', bg: days === d ? 'primary' : 'bgSurface',
                    color: days === d ? 'white' : 'textMain', cursor: 'pointer' })}>{d} gün</button>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Group selector - her grup için ayrı */}
      <div className={flex({ gap: '2', align: 'center', flexWrap: 'wrap' })}>
        <span className={css({ fontSize: 'sm', color: 'textMuted' })}>Grup:</span>
        {activeChats.length === 0 && <span className={css({ color: 'textMuted', fontSize: 'sm' })}>Aktif grup yok.</span>}
        {activeChats.map(chat => {
          const active = selectedChatId === chat.chat_id;
          return (
            <button key={chat.chat_id} onClick={() => setSelectedChatId(chat.chat_id)}
              className={css({ px: '3.5', py: '1', borderRadius: 'lg', fontSize: 'sm', borderWidth: '1px', borderStyle: 'solid',
                borderColor: active ? 'primary' : 'borderMain', bg: active ? 'primary' : 'bgSurface',
                color: active ? 'white' : 'textMain' })}>{chat.title || chat.chat_id}</button>
          );
        })}
      </div>

      {selectedChatId && (
        <>
          {/* Seçili grubun adı */}
          <div className={css({ fontSize: 'sm', color: 'textMuted', fontWeight: '600' })}>
            📊 {chats.find(c => String(c.chat_id) === String(selectedChatId))?.title || selectedChatId} için analitik
          </div>

          {/* Doughnut Charts */}
          <div className={grid({ columns: { base: 2, md: 4 }, gap: '4' })}>
            <Card><MetricChart label="Toplam Mesaj" value={report?.totalMessages || 0} color="#ef4444" max={10000} /></Card>
            <Card><MetricChart label="Katılım" value={report?.totalJoins || 0} color="#22c55e" max={1000} /></Card>
            <Card><MetricChart label="En Aktif" value={Number(topUsers[0]?.value) || 0} color="#3b82f6" max={500} /></Card>
            <Card><MetricChart label="Moderasyon" value={modActions.reduce((a: number, b: any) => a + b.value, 0)} color="#f59e0b" max={100} /></Card>
          </div>

          {/* Bar Charts */}
          <div className={grid({ columns: { base: 1, md: 2 }, gap: '6' })}>
            <Card className={css({ p: '6' })}>
              <div className={css({ fontWeight: '600', mb: '4' })}>🏆 En Aktif Kullanıcılar</div>
              {topUsers.length > 0 ? <BarChartComponent data={topUsers.slice(0, 10)} label="Mesaj" color="#ef4444" /> : <div className={css({ color: 'textMuted', py: '8', textAlign: 'center' })}>Veri yok</div>}
            </Card>
            <Card className={css({ p: '6' })}>
              <div className={css({ fontWeight: '600', mb: '4' })}>🛡️ Moderasyon İstatistikleri</div>
              {modActions.length > 0 ? <BarChartComponent data={modActions} label="İşlem" color="#f59e0b" /> : <div className={css({ color: 'textMuted', py: '8', textAlign: 'center' })}>Veri yok</div>}
            </Card>
          </div>

          {/* Raw Metrics */}
          {metrics && (
            <Card>
              <h2 className={css({ fontWeight: '600', fontSize: 'lg', mb: '4' })}>Detaylı Metrikler</h2>
              {loading ? <Spinner /> : (
                <div className={grid({ columns: { base: 1, sm: 2, lg: 3 }, gap: '4' })}>
                  {Object.entries(metrics).map(([key, val]) => (
                    <div key={key} className={css({ p: '4', bg: 'bgCanvas', borderRadius: 'lg', borderWidth: '1px', borderStyle: 'solid', borderColor: 'borderMain' })}>
                      <div className={css({ fontSize: 'xs', color: 'textMuted', textTransform: 'uppercase' })}>{key.replace(/_/g, ' ')}</div>
                      <div className={css({ fontSize: '2xl', fontWeight: 'bold', mt: '1' })}>{typeof val === 'number' ? val.toLocaleString('tr-TR') : (val as any)}</div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </>
      )}

      {!selectedChatId && (
        <Card><div className={css({ color: 'textMuted', py: '4' })}>Lütfen bir aktif grup seçin.</div></Card>
      )}
    </div>
  );
}

export default AnalyticsView;
