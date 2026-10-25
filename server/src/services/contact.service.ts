import type { ContactMessageInput, ContactMessageProfile, ContactMessageStatus } from '@restaurant/shared';
import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';

function toProfile(message: {
  id: string;
  name: string;
  email: string;
  company: string | null;
  message: string;
  status: ContactMessageStatus;
  createdAt: Date;
  updatedAt: Date;
}): ContactMessageProfile {
  return {
    id: message.id,
    name: message.name,
    email: message.email,
    company: message.company,
    message: message.message,
    status: message.status,
    createdAt: message.createdAt.toISOString(),
    updatedAt: message.updatedAt.toISOString(),
  };
}

/**
 * Public contact form submission. No tenant or account is required. The
 * client's IP and user agent are stored so abuse can be investigated, but the
 * message itself is not tied to a restaurant.
 */
export async function createContactMessage(
  input: ContactMessageInput,
  meta: { ip?: string | null; userAgent?: string | null },
): Promise<ContactMessageProfile> {
  const message = await prisma.contactMessage.create({
    data: {
      name: input.name,
      email: input.email,
      company: input.company ?? null,
      message: input.message,
      ip: meta.ip ?? null,
      userAgent: meta.userAgent ? meta.userAgent.slice(0, 512) : null,
    },
  });
  return toProfile(message);
}

/** Platform-only: list messages in the inbox. */
export async function listContactMessages(params: {
  status?: ContactMessageStatus;
  limit?: number;
}): Promise<ContactMessageProfile[]> {
  const messages = await prisma.contactMessage.findMany({
    where: params.status ? { status: params.status } : {},
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    take: params.limit ?? 50,
  });
  return messages.map(toProfile);
}

/** Platform-only: update the status of a message. */
export async function updateContactMessage(
  id: string,
  status: ContactMessageStatus,
): Promise<ContactMessageProfile> {
  const existing = await prisma.contactMessage.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound('Contact message not found');
  }
  const message = await prisma.contactMessage.update({
    where: { id },
    data: { status },
  });
  return toProfile(message);
}
