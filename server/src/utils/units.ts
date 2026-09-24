/**
 * Integer milli-unit helpers for inventory quantity math. Quantities are
 * stored as Decimal(12, 3); working in milli-units (value * 1000, rounded)
 * keeps additions/deductions exact and free of float drift.
 */

export function toMillis(value: string | number): number {
  return Math.round(parseFloat(String(value)) * 1000);
}

export function fromMillis(value: number): string {
  return (value / 1000).toFixed(3);
}