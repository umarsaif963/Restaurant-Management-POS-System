import type { Request, Response } from 'express';
import type {
  CreateTableInput,
  CreateTableSectionInput,
  ListTablesQuery,
  UpdateTableInput,
  UpdateTableSectionInput,
} from '@restaurant/shared';
import * as tableService from '../services/table.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listSections = asyncHandler(async (_req: Request, res: Response) => {
  const sections = await tableService.listSections();
  res.status(200).json({ success: true, data: { sections } });
});

export const createSection = asyncHandler(async (req: Request, res: Response) => {
  const body = req.validatedBody as CreateTableSectionInput;
  const section = await tableService.createSection(body);
  res.status(201).json({ success: true, data: { section } });
});

export const updateSection = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.validatedParams as { id: string };
  const body = req.validatedBody as UpdateTableSectionInput;
  const section = await tableService.updateSection(id, body);
  res.status(200).json({ success: true, data: { section } });
});

export const deleteSection = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.validatedParams as { id: string };
  await tableService.deleteSection(id);
  res.status(200).json({ success: true, message: 'Table section deleted' });
});

export const listTables = asyncHandler(async (req: Request, res: Response) => {
  const query = req.validatedQuery as unknown as ListTablesQuery;
  const tables = await tableService.listTables(query);
  res.status(200).json({ success: true, data: { tables } });
});

export const createTable = asyncHandler(async (req: Request, res: Response) => {
  const body = req.validatedBody as CreateTableInput;
  const table = await tableService.createTable(body);
  res.status(201).json({ success: true, data: { table } });
});

export const updateTable = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.validatedParams as { id: string };
  const body = req.validatedBody as UpdateTableInput;
  const table = await tableService.updateTable(id, body);
  res.status(200).json({ success: true, data: { table } });
});

export const deleteTable = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.validatedParams as { id: string };
  await tableService.deleteTable(id);
  res.status(200).json({ success: true, message: 'Table deleted' });
});