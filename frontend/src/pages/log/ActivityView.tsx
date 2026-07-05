import React from 'react';
import { css } from '../../../styled-system/css';
import { flex } from '../../../styled-system/patterns';
import { RefreshCw } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { PageHeader } from '../../components/ui/PageHeader';
import { format } from 'date-fns';
import { Log } from '../../types';

interface ActivityViewProps {
  logs: Log[];
  onRefresh: () => void;
}

export function ActivityView({ logs, onRefresh }: ActivityViewProps) {
  return (
    <div className={css({ display: 'flex', flexDirection: 'column', gap: '4' })}>
      <PageHeader
        title="Gerçek Zamanlı Aktivite"
        actions={
          <Button onClick={onRefresh} variant="secondary" size="sm">
            <RefreshCw size={16} /> Yenile
          </Button>
        }
      />

      <Card className={css({ p: 0, overflow: 'hidden' })}>
        {logs.length === 0 ? (
          <div className={css({ p: '10', textAlign: 'center', color: 'textMuted' })}>
            Henüz aktivite kaydı yok.
          </div>
        ) : (
          <div className={css({ divideY: '1px', divideColor: 'borderMain' })}>
            {logs.map((log: Log, index: number) => (
              <div key={index} className={flex({ 
                justify: 'space-between', 
                p: '4', 
                fontSize: 'sm',
                alignItems: 'center'
              })}>
                <div>
                  <span className={css({ fontWeight: '500' })}>
                    {log.first_name || log.username || log.user_id}
                  </span>
                  <span className={css({ color: 'textMuted', mx: '1.5' })}>→</span> 
                  <span className={css({ color: 'primary' })}>{log.chat_title || log.chat_id}</span>
                  <Badge variant="neutral" className={css({ ml: '2' })}>
                    {log.event_type}
                  </Badge>
                </div>
                <div className={css({ color: 'textMuted', fontSize: 'xs', whiteSpace: 'nowrap' })}>
                  {format(new Date(log.timestamp), 'dd MMM HH:mm')}
                  {log.message_sent ? ' ✓' : ''}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}