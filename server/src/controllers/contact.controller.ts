import type { Request, Response } from 'express';
import type { ContactMessageInput, ContactMessageStatus } from '@restaurant/shared';
import * as contactService from '../services/contact.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const submitMessage = asyncHandler(async (req: Request, res: Response) => {
  const body = req.validatedBody as ContactMessageInput;
  const message = await contactService.createContactMessage(body, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  res.status(201).json({
    success: true,
    data: { message },
    message: 'Thanks - we got your message.',
  });
});

export const listMessages = asyncHandler(async (req: Request, res: Response) => {
  const query = req.validatedQuery as { status?: ContactMessageStatus; limit?: number };
  const messages = await contactService.listContactMessages(query);
  res.status(200).json({ success: true, data: { messages } });
});

export const updateMessage = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.validatedParams as { id: string };
  const body = req.validatedBody as { status: ContactMessageStatus };
  const message = await contactService.updateContactMessage(id, body.status);
  res.status(200).json({ success: true, data: { message } });
});
