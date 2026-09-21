import type { Request, Response } from 'express';
import type { CreateUserInput, ListUsersQuery, UpdateUserInput } from '@restaurant/shared';
import * as userService from '../services/user.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const query = req.validatedQuery as unknown as ListUsersQuery;
  const data = await userService.listUsers({
    page: query.page ?? 1,
    limit: query.limit ?? 20,
    search: query.search,
    role: query.role,
    status: query.status,
  });
  res.status(200).json({ success: true, data });
});

export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.validatedParams as { id: string };
  const user = await userService.getUserById(id, req.authenticated!.role);
  res.status(200).json({ success: true, data: { user } });
});

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const body = req.validatedBody as CreateUserInput;
  const user = await userService.createUser({
    ...body,
    actorRole: req.authenticated!.role,
  });
  res.status(201).json({ success: true, data: { user } });
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.validatedParams as { id: string };
  const body = req.validatedBody as UpdateUserInput;
  const user = await userService.updateUser({
    targetId: id,
    actorUserId: req.authenticated!.userId,
    actorRole: req.authenticated!.role,
    data: body,
  });
  res.status(200).json({ success: true, data: { user } });
});

export const deactivateUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.validatedParams as { id: string };
  await userService.deactivateUser({
    targetId: id,
    actorUserId: req.authenticated!.userId,
    actorRole: req.authenticated!.role,
  });
  res.status(200).json({ success: true, message: 'User deactivated' });
});