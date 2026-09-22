/** Integer-cents money math shared by POS cart-side computations. */
function toCents(value: string | number): number {
  return Math.round((typeof value === 'number' ? value : parseFloat(value)) * 100);
}

function fromCents(cents: number): string {
  return (cents / 100).toFixed(2);
}

function percentOf(amountCents: number, percent: string | number): number {
  const pts = Math.round(parseFloat(String(percent)) * 100);
  return Math.round((amountCents * pts) / 10_000);
}

export { toCents, fromCents, percentOf };