// Serie diaria de ingresos y gastos para el gráfico de flujo del Home.
export type FlowRange = '1W' | '1M' | '3M' | '6M' | '1Y';

export const FLOW_RANGES: FlowRange[] = ['1W', '1M', '3M', '6M', '1Y'];

const DAYS: Record<FlowRange, number> = { '1W': 7, '1M': 30, '3M': 90, '6M': 180, '1Y': 365 };
const DAY_MS = 24 * 60 * 60 * 1000;

export interface FlowPoint {
  label: string;
  incomeCents: number;
  expenseCents: number;
}

interface TxLike {
  occurredOn: number;
  amountCents: number;
  kind: string;
}

export function rangeDays(range: FlowRange): number {
  return DAYS[range];
}

function startOfDay(ms: number): number {
  const d = new Date(ms);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** Serie de `days` días (terminando hoy), con ingresos y gastos sumados por día. */
export function buildDailyFlow(
  range: FlowRange,
  txs: TxLike[],
  locale: 'en' | 'es',
  nowMs: number = Date.now(),
): FlowPoint[] {
  const days = DAYS[range];
  const end = startOfDay(nowMs);
  const start = end - (days - 1) * DAY_MS;
  const loc = locale === 'es' ? 'es-ES' : 'en-US';
  const buckets: FlowPoint[] = Array.from({ length: days }, (_, i) => {
    const d = new Date(end - (days - 1 - i) * DAY_MS);
    return {
      label:
        range === '1W'
          ? d.toLocaleDateString(loc, { weekday: 'short' })
          : String(d.getDate()),
      incomeCents: 0,
      expenseCents: 0,
    };
  });
  for (const tx of txs) {
    if (tx.kind !== 'income' && tx.kind !== 'expense') {
      continue;
    }
    const day = startOfDay(tx.occurredOn);
    if (day < start || day > end) {
      continue;
    }
    const idx = Math.round((day - start) / DAY_MS);
    if (idx < 0 || idx >= days) {
      continue;
    }
    if (tx.kind === 'income') {
      buckets[idx].incomeCents += tx.amountCents;
    } else {
      buckets[idx].expenseCents += tx.amountCents;
    }
  }
  return buckets;
}
