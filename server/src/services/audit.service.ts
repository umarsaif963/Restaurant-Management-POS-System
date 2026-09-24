import type {
  AuditLogProfile,
  ListAuditLogsQuery,
  Paginated,
  PurgeAuditLogsResult,
} from '@restaurant/shared';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma.js';

/**
 * Audit trail (module 14).
 *
 * `recordAudit` is the semantic entry point used by the middleware (and
 * available to future module code). The trail can be listed with the filters
 * exposed on `GET /api/v1/audit-logs` and trimmed through the retention purge.
 */

export interface RecordAuditInput {
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  ip?: string | null;
  metadata?: Record<string, unknown>;
}

export async function recordAudit(input: RecordAuditInput): Promise<void> {
  await prisma.auditLog.create({
    data: {
      userId: input.userId ?? null,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId ?? null,
      ip: input.ip ?? null,
      metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
    },
  });
}

type AuditRow = Prisma.AuditLogGetPayload<{
  include: { user: { select: { name: true; email: true } } };
}>;

interface CapturedMetadata {
  method?: string;
  path?: string;
  status?: number;
  durationMs?: number;
  userAgent?: string;
}

function toProfile(row: AuditRow): AuditLogProfile {
  const metadata = (row.metadata ?? {}) as CapturedMetadata;
  return {
    id: row.id,
    userId: row.userId,
    userName: row.user?.name ?? null,
    userEmail: row.user?.email ?? null,
    action: row.action,
    entity: row.entity,
    entityId: row.entityId,
    method: metadata.method ?? '',
    path: metadata.path ?? '',
    status: typeof metadata.status === 'number' ? metadata.status : null,
    durationMs: typeof metadata.durationMs === 'number' ? metadata.durationMs : null,
    userAgent: metadata.userAgent ?? null,
    ip: row.ip,
    createdAt: row.createdAt.toISOString(),
  };
}

const auditInclude = () =>
  ({
    user: { select: { name: true, email: true } },
  }) as const;

export async function listAuditLogs(
  params: ListAuditLogsQuery,
): Promise<Paginated<AuditLogProfile>> {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;

  const where: Prisma.AuditLogWhereInput = {};

  if (params.search) {
    const term = params.search.trim();
    where.OR = [
      { action: { contains: term, mode: 'insensitive' } },
      { entity: { contains: term, mode: 'insensitive' } },
      { user: { name: { contains: term, mode: 'insensitive' } } },
      { user: { email: { contains: term, mode: 'insensitive' } } },
    ];
  }
  if (params.entity) {
    where.entity = params.entity;
  }

  const metadataClauses: Prisma.AuditLogWhereInput[] = [];
  if (params.method) {
    metadataClauses.push({ metadata: { path: ['method'], equals: params.method } });
  }
  if (params.status !== undefined) {
    metadataClauses.push({ metadata: { path: ['status'], equals: params.status } });
  }
  if (metadataClauses.length > 0) {
    where.AND = metadataClauses;
  }

  if (params.from || params.to) {
    where.createdAt = {
      ...(params.from ? { gte: new Date(params.from) } : {}),
      ...(params.to ? { lte: new Date(params.to) } : {}),
    };
  }

  const [total, rows] = await prisma.$transaction([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: params.sort === 'asc' ? 'asc' : 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: auditInclude(),
    }),
  ]);

  return { items: rows.map(toProfile), page, limit, total, totalPages: Math.ceil(total / limit) };
}

export async function purgeAuditLogs(olderThanDays: number): Promise<PurgeAuditLogsResult> {
  const cutoff = new Date(Date.now() - olderThanDays * 86_400_000);
  const { count } = await prisma.auditLog.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });
  return { deleted: count };
}