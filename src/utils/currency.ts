// Moneda base congelada: USD ($). Todos los montos se almacenan como INTEGER
// en céntimos. Prohibido usar float en el hot path transaccional.
export const BASE_CURRENCY = 'USD' as const;
export const BASE_LOCALE = 'en-US' as const;

const MAX_INTEGER_DIGITS = 9;

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/**
 * Parsea un buffer del teclado numérico ("10.00", "10", "0.5") a céntimos.
 * Lanza en input inválido, negativo o > 9 dígitos enteros.
 */
export function toCents(input: string): number {
  const raw = input.trim().replace(/[$,\s]/g, '');
  if (!/^\d+(\.\d{0,2})?$/.test(raw)) {
    throw new Error(`Invalid amount: "${input}"`);
  }
  const [intPart, decPart = ''] = raw.split('.');
  if (intPart.length > MAX_INTEGER_DIGITS) {
    throw new Error(`Amount too large: "${input}"`);
  }
  return Number(intPart) * 100 + Number((decPart + '00').slice(0, 2));
}

/** Formatea céntimos a "$10.00". Solo capa View — nunca persistir el string. */
export function formatCents(
  cents: number,
  currency: string = BASE_CURRENCY,
  locale: string = BASE_LOCALE,
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

/** Clave de agregación mensual en zona horaria local: "2026-10". */
export function monthKeyFromEpoch(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
}

/** Clave diaria en zona horaria local: "2026-10-01". */
export function dateKeyFromEpoch(ms: number): string {
  const d = new Date(ms);
  return `${monthKeyFromEpoch(ms)}-${pad2(d.getDate())}`;
}
