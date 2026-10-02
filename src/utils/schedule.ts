// Lógica de calendario pura (sin dependencias ni estado). Hora local.
export type Frequency = 'daily' | 'weekly' | 'monthly' | 'custom';
export type BudgetPeriod = 'daily' | 'weekly' | 'monthly' | 'custom';
export type IntervalUnit = 'day' | 'week' | 'month';

/**
 * `day`:
 *  - weekly: 1..7 (1=lunes ... 7=domingo)
 *  - monthly: 1..31 (se recorta al último día del mes si no existe)
 *  - daily/custom: ignorado
 * `count`/`unit`: solo para custom ("cada N días/semanas/meses").
 */
export interface Schedule {
  frequency: Frequency;
  day?: number;
  count?: number;
  unit?: IntervalUnit;
}

function startOfDay(ref: Date): Date {
  return new Date(ref.getFullYear(), ref.getMonth(), ref.getDate(), ref.getHours(), ref.getMinutes(), 0, 0);
}

/** Medianoche local (para ventanas de presupuesto). */
function midnight(ref: Date): Date {
  return new Date(ref.getFullYear(), ref.getMonth(), ref.getDate(), 0, 0, 0, 0);
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** Lunes=1 ... Domingo=7. */
export function isoWeekday(date: Date): number {
  return ((date.getDay() + 6) % 7) + 1;
}

const clampCount = (n?: number) => Math.min(Math.max(Math.round(n ?? 1) || 1, 1), 365);
const clampDay = (n?: number) => Math.min(Math.max(Math.round(n ?? 1) || 1, 1), 31);

/** Suma count*unit meses/días conservando la hora. */
function addMonths(from: Date, months: number): Date {
  const d = new Date(from);
  const targetMonth = d.getMonth() + months;
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(targetMonth);
  d.setDate(Math.min(day, daysInMonth(d.getFullYear(), d.getMonth())));
  return d;
}

/**
 * Siguiente ocurrencia ESTRICTAMENTE posterior a `fromMs` (evita disparar
 * justo al crear la regla). Conserva la hora del día de `fromMs`.
 */
export function advanceSchedule(schedule: Schedule, fromMs: number): number {
  const from = new Date(fromMs);

  if (schedule.frequency === 'daily') {
    const d = new Date(from);
    d.setDate(d.getDate() + 1);
    return d.getTime();
  }

  if (schedule.frequency === 'weekly') {
    const target = isoWeekdayTarget(schedule.day);
    const base = startOfDay(from);
    let diff = (target - isoWeekday(base) + 7) % 7;
    if (diff === 0) {
      diff = 7;
    }
    base.setDate(base.getDate() + diff);
    return base.getTime();
  }

  if (schedule.frequency === 'custom') {
    const count = clampCount(schedule.count);
    if (schedule.unit === 'week') {
      const d = new Date(from);
      d.setDate(d.getDate() + count * 7);
      return d.getTime();
    }
    if (schedule.unit === 'month') {
      return addMonths(from, count).getTime();
    }
    const d = new Date(from);
    d.setDate(d.getDate() + count);
    return d.getTime();
  }

  // monthly
  const targetDom = clampDay(schedule.day);
  const year = from.getFullYear();
  const month = from.getMonth();
  const dom = Math.min(targetDom, daysInMonth(year, month));
  const candidate = new Date(year, month, dom, from.getHours(), from.getMinutes(), 0, 0);
  if (candidate.getTime() > fromMs) {
    return candidate.getTime();
  }
  const nextYear = month === 11 ? year + 1 : year;
  const nextMonth = month === 11 ? 0 : month + 1;
  const dom2 = Math.min(targetDom, daysInMonth(nextYear, nextMonth));
  return new Date(nextYear, nextMonth, dom2, from.getHours(), from.getMinutes(), 0, 0).getTime();
}

function isoWeekdayTarget(day?: number): number {
  return Math.min(Math.max(Math.round(day ?? 1) || 1, 1), 7);
}

export interface Window {
  from: number;
  to: number;
}

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

/** Ventana [from,to) del presupuesto que contiene `nowMs`. */
export function budgetWindow(
  period: BudgetPeriod,
  count: number,
  unit: IntervalUnit,
  nowMs: number,
): Window {
  const now = new Date(nowMs);
  if (period === 'daily') {
    const from = midnight(now);
    return { from: from.getTime(), to: from.getTime() + DAY };
  }
  if (period === 'weekly') {
    const from = midnight(now);
    from.setDate(from.getDate() - (isoWeekday(from) - 1));
    return { from: from.getTime(), to: from.getTime() + 7 * DAY };
  }
  if (period === 'monthly') {
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return { from: from.getTime(), to: to.getTime() };
  }
  // custom: últimos N días/semanas/meses
  const n = clampCount(count);
  if (unit === 'month') {
    const from = new Date(now.getFullYear(), now.getMonth() - (n - 1), 1);
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return { from: from.getTime(), to: to.getTime() };
  }
  const days = unit === 'week' ? n * 7 : n;
  const today = midnight(now);
  const from = new Date(today);
  from.setDate(from.getDate() - (days - 1));
  return { from: from.getTime(), to: today.getTime() + DAY };
}
