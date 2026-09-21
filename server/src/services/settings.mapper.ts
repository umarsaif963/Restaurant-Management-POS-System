import type { Restaurant, RestaurantSettings } from '@prisma/client';
import type {
  RestaurantProfile,
  RestaurantSettingsProfile,
  SettingsView,
} from '@restaurant/shared';

export type SettingsRecord = RestaurantSettings & { restaurant: Restaurant };

export function toRestaurantProfile(restaurant: Restaurant): RestaurantProfile {
  return {
    id: restaurant.id,
    name: restaurant.name,
    logoUrl: restaurant.logoUrl,
    address: restaurant.address,
    phone: restaurant.phone,
    email: restaurant.email,
    currency: restaurant.currency,
    taxPercentage: restaurant.taxPercentage.toString(),
    serviceChargePct: restaurant.serviceChargePct.toString(),
    isActive: restaurant.isActive,
  };
}

export function toRestaurantSettingsProfile(
  settings: RestaurantSettings,
): RestaurantSettingsProfile {
  return {
    id: settings.id,
    currency: settings.currency,
    taxPercentage: settings.taxPercentage.toString(),
    serviceChargePct: settings.serviceChargePct.toString(),
    receiptHeader: settings.receiptHeader,
    receiptFooter: settings.receiptFooter,
    orderNumberPrefix: settings.orderNumberPrefix,
    orderNumberStart: settings.orderNumberStart,
    openingHours: settings.openingHours as Record<string, string> | null,
    showTaxOnReceipt: settings.showTaxOnReceipt,
    showServiceChargeOnReceipt: settings.showServiceChargeOnReceipt,
  };
}

export function toSettingsView(record: SettingsRecord): SettingsView {
  return {
    restaurant: toRestaurantProfile(record.restaurant),
    settings: toRestaurantSettingsProfile(record),
  };
}