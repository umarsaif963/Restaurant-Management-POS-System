import type { ReceiptView } from '@restaurant/shared';
import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { getOrder } from './order.service.js';
import { listOrderPayments } from './payment.service.js';

/**
 * Customer receipt payload (module 7 + payments module 9): order snapshot,
 * payment history, restaurant branding and the settings that control what the
 * printed receipt shows.
 */
export async function buildReceipt(orderId: string): Promise<ReceiptView> {
  const settings = await prisma.restaurantSettings.findFirst({ include: { restaurant: true } });
  if (!settings) {
    throw ApiError.notFound('Restaurant settings not found');
  }
  const order = await getOrder(orderId);
  const payments = await listOrderPayments(orderId);

  return {
    order,
    restaurantName: settings.restaurant.name,
    restaurantAddress: settings.restaurant.address,
    restaurantPhone: settings.restaurant.phone,
    restaurantEmail: settings.restaurant.email,
    currency: settings.restaurant.currency || settings.currency,
    receiptHeader: settings.receiptHeader,
    receiptFooter: settings.receiptFooter,
    showTaxOnReceipt: settings.showTaxOnReceipt,
    showServiceChargeOnReceipt: settings.showServiceChargeOnReceipt,
    serviceChargePct: settings.serviceChargePct.toString(),
    taxPercentage: settings.taxPercentage.toString(),
    payments,
    printedAt: new Date().toISOString(),
  };
}