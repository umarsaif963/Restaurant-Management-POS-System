import type { Request, Response } from 'express';
import type { CreateRoleInput, UpdateRoleInput } from '@restaurant/shared';
import * as roleService from '../services/role.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { actorFrom } from '../utils/actor.js';

export const listRoles = asyncHandler(async (req: Request, res: Response) => {
  const roles = await roleService.listRoles(actorFrom(req));
  res.status(200).json({ success: true, data: { roles } });
});

export const getRole = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.validatedParams as { id: string };
  const role = await roleService.getRole(id, actorFrom(req));
  res.status(200).json({ success: true, data: { role } });
});

export const createRole = asyncHandler(async (req: Request, res: Response) => {
  const body = req.validatedBody as CreateRoleInput;
  const role = await roleService.createRole(body, actorFrom(req));
  res.status(201).json({ success: true, data: { role } });
});

export const updateRole = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.validatedParams as { id: string };
  const body = req.validatedBody as UpdateRoleInput;
  const role = await roleService.updateRole(id, body, actorFrom(req));
  res.status(200).json({ success: true, data: { role } });
});

export const deleteRole = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.validatedParams as { id: string };
  await roleService.deleteRole(id, actorFrom(req));
  res.status(200).json({ success: true, message: 'Role deleted' });
});
