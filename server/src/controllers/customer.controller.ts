import type { Request, Response } from 'express';
import type { CreateCustomerInput, ListCustomersQuery, UpdateCustomerInput } from '@restaurant/shared';
import * as customerService from '../services/customer.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listCustomers = asyncHandler(async (req: Request, res: Response) => {
  const query = req.validatedQuery as unknown as ListCustomersQuery;
  const data = await customerService.listCustomers({
    page: query.page ?? 1,
    limit: query.limit ?? 20,
    search: query.search,
  });
  res.status(200).json({ success: true, data });
});

export const getCustomer = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.validatedParams as { id: string };
  const customer = await customerService.getCustomer(id);
  res.status(200).json({ success: true, data: { customer } });
});

export const createCustomer = asyncHandler(async (req: Request, res: Response) => {
  const body = req.validatedBody as CreateCustomerInput;
  const customer = await customerService.createCustomer(body);
  res.status(201).json({ success: true, data: { customer } });
});

export const updateCustomer = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.validatedParams as { id: string };
  const body = req.validatedBody as UpdateCustomerInput;
  const customer = await customerService.updateCustomer(id, body);
  res.status(200).json({ success: true, data: { customer } });
});

export const deleteCustomer = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.validatedParams as { id: string };
  await customerService.deleteCustomer(id);
  res.status(200).json({ success: true, message: 'Customer deleted' });
});