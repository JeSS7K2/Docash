import { intlLocale } from '../i18n';
import type { Locale } from '../state/useSettings';
import type { PeriodKind } from './dateRange';

export interface TrendBucket {
  label: string;
  valueCents: number;
}

interface TxLike {
  occurredOn: number;
  amountCents: number;
  kind: 'expense' | 'income' | 'transfer';
}

interface BucketDef {
  start: number;
  label: string;
}

function bucketsFor(period: PeriodKind, anchorMs: number, locale: Locale): BucketDef[] {
  const loc = intlLocale(locale);
  const anchor = new Date(anchorMs);
  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  const dayMs = 24 * 60 * 60 * 1000;

  if (period === 'day') {
    const base = new Date(year, month, anchor.getDate());
    return Array.from({ length: 24 }, (_, h) => ({
      start: base.getTime() + h * 60 * 60 * 1000,
      label: String(h),
    }));
  }
  if (period === 'week') {
    const mondayOffset = (anchor.getDay() + 6) % 7;
    const start = new Date(year, month, anchor.getDate() - mondayOffset);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start.getTime() + i * dayMs);
      return { start: d.getTime(), label: d.toLocaleDateString(loc, { weekday: 'short' }) };
    });
  }
  if (period === 'month') {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => ({
      start: new Date(year, month, i + 1).getTime(),
      label: String(i + 1),
    }));
  }
  if (period === 'year') {
    return Array.from({ length: 12 }, (_, m) => ({
      start: new Date(year, m, 1).getTime(),
      label: new Date(year, m, 1).toLocaleDateString(loc, { month: 'short' }),
    }));
  }
  // 'all': últimos 12 meses hasta el ancla.
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(year, month - 11 + i, 1);
    return { start: d.getTime(), label: d.toLocaleDateString(loc, { month: 'short' }) };
  });
}

/** Serie de gastos agregada por bucket temporal para el gráfico de tendencia. */
export function buildTrend(
  period: PeriodKind,
  anchorMs: number,
  txs: TxLike[],
  locale: Locale,
): TrendBucket[] {
  const defs = bucketsFor(period, anchorMs, locale);
  const values = new Array(defs.length).fill(0);
  for (const tx of txs) {
    if (tx.kind === 'income') {
      continue; // el gráfico muestra gasto
    }
    // último bucket cuyo start <= occurredOn
    let idx = -1;
    for (let i = 0; i < defs.length; i++) {
      if (defs[i].start <= tx.occurredOn) {
        idx = i;
      } else {
        break;
      }
    }
    if (idx >= 0) {
      values[idx] += tx.amountCents;
    }
  }
  return defs.map((d, i) => ({ label: d.label, valueCents: values[i] }));
}
