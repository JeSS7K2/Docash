// Rangos temporales puros (sin dependencias). `to` es exclusivo.
// Semana ISO: empieza en lunes, hora local.
export type PeriodKind = 'day' | 'week' | 'month' | 'year' | 'all';

export interface EpochRange {
  from: number;
  to: number;
}

function startOfDay(ref: Date): Date {
  return new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** Rango [from, to) en ms para el periodo que contiene a `anchorMs`. */
export function rangeForPeriod(period: PeriodKind, anchorMs: number): EpochRange | null {
  if (period === 'all') {
    return null;
  }
  const anchor = new Date(anchorMs);
  const year = anchor.getFullYear();
  const month = anchor.getMonth();

  let start: Date;
  let end: Date;
  switch (period) {
    case 'day':
      start = startOfDay(anchor);
      end = addDays(start, 1);
      break;
    case 'week': {
      const mondayOffset = (anchor.getDay() + 6) % 7; // 0 = lunes
      start = addDays(startOfDay(anchor), -mondayOffset);
      end = addDays(start, 7);
      break;
    }
    case 'month':
      start = new Date(year, month, 1);
      end = new Date(year, month + 1, 1);
      break;
    case 'year':
      start = new Date(year, 0, 1);
      end = new Date(year + 1, 0, 1);
      break;
    default:
      return null;
  }
  return { from: start.getTime(), to: end.getTime() };
}

/** Desplaza el ancla un periodo (direction: 1 siguiente, -1 anterior). 'all' no-op. */
export function shiftAnchor(period: PeriodKind, anchorMs: number, direction: 1 | -1): number {
  if (period === 'all') {
    return anchorMs;
  }
  const d = new Date(anchorMs);
  switch (period) {
    case 'day':
      d.setDate(d.getDate() + direction);
      break;
    case 'week':
      d.setDate(d.getDate() + 7 * direction);
      break;
    case 'month':
      d.setMonth(d.getMonth() + direction);
      break;
    case 'year':
      d.setFullYear(d.getFullYear() + direction);
      break;
  }
  return d.getTime();
}

/** Etiqueta legible del periodo (para el header del Home / centro del donut). */
export function labelForPeriod(
  period: PeriodKind,
  anchorMs: number,
  locale = 'en-US',
): string {
  const d = new Date(anchorMs);
  switch (period) {
    case 'day':
      return d.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
    case 'week': {
      const range = rangeForPeriod('week', anchorMs)!;
      const end = new Date(range.to - 1);
      const fmt = (x: Date) =>
        x.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
      return `${fmt(d)} – ${fmt(end)}`;
    }
    case 'month':
      return d.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
    case 'year':
      return String(d.getFullYear());
    default:
      return 'All time';
  }
}
