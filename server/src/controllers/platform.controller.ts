import type { Request, Response } from 'express';
import type { UpdatePlatformRestaurantInput } from '@restaurant/shared';
import * as platformService from '../services/platform.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';

export const getStats = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await platformService.getPlatformStats();
  res.status(200).json({ success: true, data: stats });
});

export const listRestaurants = asyncHandler(async (req: Request, res: Response) => {
  const query = req.validatedQuery as {
    search?: string;
    status?: 'PENDING' | 'ACTIVE' | 'SUSPENDED';
    plan?: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  };
  const restaurants = await platformService.listRestaurants(query);
  res.status(200).json({ success: true, data: { restaurants } });
});

export const getRestaurant = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.validatedParams as { id: string };
  const restaurants = await platformService.listRestaurants({});
  const restaurant = restaurants.find((item) => item.id === id);
  if (!restaurant) {
    throw ApiError.notFound('Restaurant not found');
  }
  res.status(200).json({ success: true, data: { restaurant } });
});

export const updateRestaurant = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.validatedParams as { id: string };
  const body = req.validatedBody as UpdatePlatformRestaurantInput;
  const restaurant = await platformService.updateRestaurant(id, body);
  res.status(200).json({ success: true, data: { restaurant } });
});
