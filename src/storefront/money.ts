/** "3,900". Grouping is done by hand so the server and every browser render the same text. */
export function amount(n: number): string {
  const r = Math.round(n);
  const digits = String(Math.abs(r)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return r < 0 ? `-${digits}` : digits;
}

/** "KES 3,900". */
export function kes(n: number): string {
  return `KES ${amount(n)}`;
}
