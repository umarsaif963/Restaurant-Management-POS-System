/**
 * Exact integer-cents money helpers. Amounts are converted to an integer
 * number of cents for arithmetic, then formatted back to a 2-decimal string
 * so floating-point drift never enters the database.
 */

export function toCents(value: string | number): number {
  if (typeof value === 'number') {
    return Math.round(value * 100);
  }
  return Math.round(parseFloat(value) * 100);
}

export function fromCents(cents: number): string {
  return (cents / 100).toFixed(2);
}

/** Percentage applied to a money amount, exact to 2 decimal places. */
export function percentOf(amountCents: number, percent: string | number): number {
  const pts = Math.round(parseFloat(String(percent)) * 100);
  return Math.round((amountCents * pts) / 10_000);
}