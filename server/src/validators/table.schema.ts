import { z } from 'zod';
import { TableStatus } from '@prisma/client';
import { resourceIdParamsSchema } from './common.js';

export { resourceIdParamsSchema };

export const tableSectionNameSchema = z
  .string()
  .trim()
  .min(1, 'Name is required')
  .max(60, 'Name must be at most 60 characters');

export const createTableSectionSchema = z.object({
  name: tableSectionNameSchema,
  position: z
    .number()
    .int()
    .min(0, 'Position cannot be negative')
    .max(1000, 'Position is too large')
    .optional(),
});

export const updateTableSectionSchema = z
  .object({
    name: tableSectionNameSchema.optional(),
    position: z.number().int().min(0).max(1000).optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'Provide at least one field to update',
  });

const tableNumberSchema = z
  .number()
  .int()
  .min(1, 'Table number must be at least 1')
  .max(9999, 'Table number is too large');

const tableNameSchema = z
  .string()
  .trim()
  .max(60, 'Name must be at most 60 characters')
  .transform((value) => (value === '' ? null : value))
  .optional();

const capacitySchema = z
  .number()
  .int()
  .min(1, 'Capacity must be at least 1')
  .max(100, 'Capacity is too large');

const sectionIdSchema = z.union([z.null(), z.string().min(1).max(64)]);

export const createTableSchema = z.object({
  tableNumber: tableNumberSchema,
  name: tableNameSchema,
  capacity: capacitySchema.optional(),
  sectionId: sectionIdSchema.optional(),
});

export const updateTableSchema = z
  .object({
    tableNumber: tableNumberSchema.optional(),
    name: tableNameSchema,
    capacity: capacitySchema.optional(),
    sectionId: sectionIdSchema.optional(),
    status: z.nativeEnum(TableStatus).optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'Provide at least one field to update',
  });

export const listTablesQuerySchema = z.object({
  status: z.nativeEnum(TableStatus).optional(),
  sectionId: z.string().min(1).max(64).optional(),
});