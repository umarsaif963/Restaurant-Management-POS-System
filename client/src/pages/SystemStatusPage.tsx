import { useEffect, useRef, type ReactNode } from 'react';
import { RefreshCw, Server, Signal } from 'lucide-react';
import { useGetHealthQuery } from '@/store/api/healthApi';
import { useRealtimeStatus } from '@/hooks/useRealtimeStatus';
import { useToast } from '@/hooks/useToast';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { StatusDot } from '@/components/ui/StatusDot';
import { Spinner } from '@/components/ui/Spinner';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatDateTime, formatUptime } from '@/utils/format';

const DATABASE_LABELS: Record<string, string> = {
  connected: 'Connected',
  unreachable: 'Unreachable',
  configured: 'Configured',
  'not-configured': 'Not configured',
};

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-medium text-slate-800">{value}</span>
    </div>
  );
}

export function SystemStatusPage() {
  const toast = useToast();
  const { data, isError, isLoading, isFetching, isUninitialized, refetch } = useGetHealthQuery(
    undefined,
    { pollingInterval: 15_000 },
  );
  const realtime = useRealtimeStatus();
  const erroredRef = useRef(false);

  useEffect(() => {
    if (isError && !erroredRef.current) {
      erroredRef.current = true;
      toast.error('API request failed', 'Could not reach the server. Is it running?');
    }
    if (data && erroredRef.current) {
      erroredRef.current = false;
    }
  }, [isError, data, toast]);

  const healthTone = isError ? 'red' : data ? 'green' : 'amber';
  const healthLabel = isError ? 'Offline' : data ? 'Online' : 'Loading';

  const realtimeTone =
    realtime.state === 'connected' ? 'green' : realtime.state === 'connecting' ? 'amber' : 'red';

  return (
    <div>
      <PageHeader
        title="System Status"
        description="Live connectivity between this POS client and the backend services."
        actions={
          <button type="button" className="btn-secondary" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? <Spinner className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card
          title="API Service"
          icon={<Server className="h-4 w-4 text-slate-400" />}
          actions={
            <Badge variant={healthTone}>
              <StatusDot tone={healthTone} pulse={isFetching} />
              {healthLabel}
            </Badge>
          }
        >
          {isLoading || isUninitialized ? (
            <div className="space-y-3">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-5 w-3/4" />
            </div>
          ) : isError || !data ? (
            <div className="flex items-center justify-center gap-2 py-4 text-sm text-slate-500">
              <StatusDot tone="red" />
              Failed to load server health. Start the API server and retry.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              <InfoRow label="Service" value={data.service} />
              <InfoRow label="Version" value={data.version} />
              <InfoRow label="Environment" value={data.environment} />
              <InfoRow label="Uptime" value={formatUptime(data.uptime)} />
              <InfoRow label="Database" value={DATABASE_LABELS[data.database] ?? data.database} />
              <InfoRow label="Last checked" value={formatDateTime(data.timestamp)} />
            </div>
          )}
        </Card>

        <Card
          title="Real-time Channel"
          icon={<Signal className="h-4 w-4 text-slate-400" />}
          actions={
            <Badge variant={realtimeTone}>
              <StatusDot tone={realtimeTone} pulse={realtime.state === 'connected'} />
              {realtime.state === 'connected'
                ? 'Connected'
                : realtime.state === 'connecting'
                  ? 'Connecting'
                  : 'Disconnected'}
            </Badge>
          }
        >
          <div className="divide-y divide-slate-100">
            <InfoRow
              label="Connection"
              value={realtime.state === 'connected' ? 'Socket.IO connected' : realtime.state}
            />
            <InfoRow
              label="Estimated latency"
              value={
                realtime.latencyMs === null ? '—' : `${realtime.latencyMs.toLocaleString()} ms`
              }
            />
            <InfoRow
              label="Server"
              value={realtime.serverInfo ? realtime.serverInfo.service : '—'}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}