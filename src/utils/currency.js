/**
 * Format numeric currency values into Japanese Yen strings.
 * Keeps raw integer representation internally for exact calculations.
 */
export function formatYen(amount, short = false) {
  const num = Number(amount) || 0;
  
  if (short) {
    if (Math.abs(num) >= 1_000_000_000) {
      return `¥${(num / 1_000_000_000).toFixed(1)}B`;
    }
    if (Math.abs(num) >= 1_000_000) {
      return `¥${(num / 1_000_000).toFixed(0)}M`;
    }
    if (Math.abs(num) >= 1_000) {
      return `¥${(num / 1_000).toFixed(0)}K`;
    }
  }

  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Parses user input string or number to clean positive integer
 */
export function parseYenInput(val) {
  if (typeof val === 'number') return Math.max(0, Math.floor(val));
  if (!val) return 0;
  const cleaned = String(val).replace(/[^0-9]/g, '');
  return parseInt(cleaned, 10) || 0;
}
