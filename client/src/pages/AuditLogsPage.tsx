import { useEffect, useState } from 'react';
import { Eraser, RefreshCw, ScrollText, Search } from 'lucide-react';
import type { AuditLogProfile, ListAuditLogsQuery } from '@restaurant/shared';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { Spinner } from '@/components/ui/Spinner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useListAuditLogsQuery, usePurgeAuditLogsMutation } from '@/store/api/auditApi';
import { useDebounce } from '@/hooks/useDebounce';
import { useToast } from '@/hooks/useToast';
import { formatDateTime } from '@/utils/format';

const PAGE_SIZE = 20;

const METHOD_LABELS: Record<string, string> = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
};

const METHOD_BADGE: Record<string, 'blue' | 'green' | 'amber' | 'slate' | 'red'> = {
  GET: 'blue',
  POST: 'green',
  PUT: 'amber',
  PATCH: 'amber',
  DELETE: 'red',
};

const STATUS_OPTIONS = [200, 201, 400, 401, 403, 404, 409, 422, 429, 500];

function statusTone(status: number | null): 'green' | 'amber' | 'red' | 'slate' {
  if (status === null) return 'slate';
  if (status >= 200 && status < 300) return 'green';
  if (status >= 500) return 'red';
  return 'amber';
}

function ActionCell({ entry }: { entry: AuditLogProfile }) {
  if (entry.method) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant={METHOD_BADGE[entry.method] ?? 'slate'}>{METHOD_LABELS[entry.method] ?? entry.method}</Badge>
        <span className="font-mono text-xs text-slate-700">{entry.path}</span>
      </div>
    );
  }
  return (
    <div>
      <p className="font-medium text-slate-800">{entry.action}</p>
      {entry.entityId && <p className="font-mono text-xs text-slate-400">{entry.entityId}</p>}
    </div>
  );
}

export function AuditLogsPage() {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [method, setMethod] = useState('');
  const [status, setStatus] = useState('');

  const [purgeOpen, setPurgeOpen] = useState(false);
  const [purgeDays, setPurgeDays] = useState(90);
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, method, status]);

  const query: ListAuditLogsQuery = {
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch || undefined,
    method: method || undefined,
    status: status ? Number(status) : undefined,
  };

  const { data, isError, isFetching, refetch } = useListAuditLogsQuery(query);
  const [purge, { isLoading: purging }] = usePurgeAuditLogsMutation();

  async function handlePurge() {
    try {
      const deleted = await purge({ olderThanDays: purgeDays }).unwrap();
      toast.success('Audit trail trimmed', `${deleted} entr${deleted === 1 ? 'y' : 'ies'} older than ${purgeDays} day${purgeDays === 1 ? '' : 's'} were removed.`);
      setPage(1);
      setPurgeOpen(false);
    } catch (error) {
      toast.error('Purge failed', extractApiErrorMessage(error));
    }
  }

  return (
    <div>
      <PageHeader
        title="Audit Logs"
        description="Immutable request trail for the API — who did what, when, and the outcome."
        actions={
          <div className="flex items-center gap-2">
<button
            type="button"
            className="btn-secondary"
            onClick={() => setPurgeOpen(true)}
            aria-label="Purge old audit entries"
          >
            <Eraser className="h-4 w-4" />
            Purge
          </button>
          <div className="flex items-center gap-2">
            <label htmlFor="purge-days" className="text-xs text-slate-500">
              Retention
            </label>
            <select
              id="purge-days"
              className="input w-28"
              value={purgeDays}
              onChange={(event) => setPurgeDays(Number(event.target.value))}
              aria-label="Retention in days"
            >
              {[30, 60, 90, 180, 365].map((days) => (
                <option key={days} value={days}>
                  {days} days
                </option>
              ))}
            </select>
          </div>
            <button type="button" className="btn-secondary" onClick={() => refetch()} disabled={isFetching}>
              {isFetching ? <Spinner className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}
              Refresh
            </button>
          </div>
        }
      />

      <Card>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              className="input pl-9"
              placeholder="Search action, entity, user…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search audit log"
            />
          </div>
          <select
            className="input w-auto"
            value={method}
            onChange={(event) => setMethod(event.target.value)}
            aria-label="Filter by HTTP method"
          >
            <option value="">All methods</option>
            {Object.entries(METHOD_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            className="input w-auto"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            aria-label="Filter by status code"
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
      </Card>

      <div className="mt-6">
        <Card className="p-0">
          {isError ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <p className="text-sm text-slate-500">Could not load the audit trail.</p>
              <button type="button" className="btn-secondary" onClick={() => refetch()}>
                Retry
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Time</th>
                    <th className="px-4 py-3 font-semibold">Action</th>
                    <th className="px-4 py-3 font-semibold">Entity</th>
                    <th className="px-4 py-3 font-semibold">Result</th>
                    <th className="px-4 py-3 font-semibold">Actor</th>
                    <th className="px-4 py-3 font-semibold">IP</th>
                    <th className="px-4 py-3 text-right font-semibold">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {isFetching && !data ? (
                    Array.from({ length: 6 }).map((_, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3" colSpan={7}>
                          <Skeleton className="h-5 w-full" />
                        </td>
                      </tr>
                    ))
                  ) : data && data.items.length > 0 ? (
                    data.items.map((entry) => (
                      <tr key={entry.id} className="transition hover:bg-slate-50">
                        <td className="px-4 py-3 text-xs text-slate-500">{formatDateTime(entry.createdAt)}</td>
                        <td className="px-4 py-3">
                          <ActionCell entry={entry} />
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="slate">{entry.entity}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={statusTone(entry.status)}>
                            {entry.status === null ? '—' : entry.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          {entry.userName ? (
                            <div>
                              <p className="font-medium text-slate-800">{entry.userName}</p>
                              <p className="text-xs text-slate-400">{entry.userEmail}</p>
                            </div>
                          ) : (
                            <span className="text-xs italic text-slate-400">unauthenticated</span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-500">{entry.ip ?? '—'}</td>
                        <td className="px-4 py-3 text-right text-xs text-slate-500">
                          {entry.durationMs === null ? '—' : `${entry.durationMs} ms`}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7}>
                        <EmptyState
                          icon={<ScrollText className="h-6 w-6" />}
                          title={debouncedSearch || method || status ? 'Nothing matches your filters' : 'No audit entries yet'}
                          description={
                            debouncedSearch || method || status
                              ? 'Try clearing filters.'
                              : 'API requests appear here as they happen.'
                          }
                        />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {data && data.total > 0 && (
            <div className="border-t border-slate-100 px-4 py-3">
              <Pagination page={data.page} totalPages={data.totalPages} total={data.total} onPageChange={setPage} />
            </div>
          )}
          {isFetching && data && (
            <div className="flex justify-center border-t border-slate-100 py-3">
              <Spinner className="h-4 w-4 text-slate-400" />
            </div>
          )}
        </Card>
      </div>

      <ConfirmDialog
        open={purgeOpen}
        title="Purge old audit entries"
        message={`Retention delete: remove every entry older than ${purgeDays} day${purgeDays === 1 ? '' : 's'}? This cannot be undone — choose a conservative window on live systems.`}
        confirmLabel="Purge entries"
        busy={purging}
        onCancel={() => setPurgeOpen(false)}
        onConfirm={handlePurge}
      />
    </div>
  );
}

function extractApiErrorMessage(error: unknown): string {
  const anyError = error as { data?: { message?: string } };
  return anyError.data?.message ?? 'Try again.';
}