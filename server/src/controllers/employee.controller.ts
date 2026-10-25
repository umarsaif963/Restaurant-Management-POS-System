import type { Request, Response } from 'express';
import type {
  CreateEmployeeInput,
  ListEmployeesQuery,
  UpdateEmployeeInput,
} from '@restaurant/shared';
import * as userService from '../services/user.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { actorFrom } from '../utils/actor.js';

export const listEmployees = asyncHandler(async (req: Request, res: Response) => {
  const query = req.validatedQuery as unknown as ListEmployeesQuery;
  const data = await userService.listEmployees(
    {
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      search: query.search,
      role: query.role,
      status: query.status,
    },
    actorFrom(req),
  );
  res.status(200).json({ success: true, data });
});

export const getEmployee = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.validatedParams as { id: string };
  const employee = await userService.getEmployee(id, actorFrom(req));
  res.status(200).json({ success: true, data: { employee } });
});

export const createEmployee = asyncHandler(async (req: Request, res: Response) => {
  const body = req.validatedBody as CreateEmployeeInput;
  const result = await userService.createEmployee(body, actorFrom(req));
  res.status(201).json({
    success: true,
    data: result,
    message: result.temporaryPassword
      ? 'Employee created. Share the temporary password with them.'
      : 'Employee created',
  });
});

export const updateEmployee = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.validatedParams as { id: string };
  const body = req.validatedBody as UpdateEmployeeInput;
  const employee = await userService.updateEmployee(id, body, actorFrom(req));
  res.status(200).json({ success: true, data: { employee } });
});

export const deactivateEmployee = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.validatedParams as { id: string };
  await userService.deactivateEmployee(id, actorFrom(req));
  res.status(200).json({ success: true, message: 'Employee deactivated' });
});

export const reactivateEmployee = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.validatedParams as { id: string };
  const employee = await userService.reactivateEmployee(id, actorFrom(req));
  res.status(200).json({ success: true, data: { employee } });
});

export const resetEmployeePassword = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.validatedParams as { id: string };
  const result = await userService.resetEmployeePassword(id, actorFrom(req));
  res.status(200).json({ success: true, data: result });
});
