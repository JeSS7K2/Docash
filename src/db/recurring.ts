import { Q, type Database } from '@nozbe/watermelondb';
import { createTransaction, type EntryKind } from './operations';
import type RecurringRule from './models/RecurringRule';
import type { Frequency, IntervalUnit } from './models/RecurringRule';
import { advanceSchedule, isoWeekday, type Schedule } from '../utils/schedule';

export interface RecurringInput {
  accountId: string;
  categoryId: string;
  kind: EntryKind;
  amountCents: number;
  frequency: Frequency;
  /** weekly: 1..7; monthly: 1..31. */
  scheduleDay?: number;
  /** custom: cada N días/semanas/meses. */
  intervalCount?: number;
  intervalUnit?: IntervalUnit;
  note?: string;
  /** Override del próximo disparo (tests/pruebas). */
  nextRun?: number;
}

const MAX_CATCHUP = 60; // tope anti-bucle si next_run quedó muy atrás

/** Día por defecto si no se especifica: hoy. */
export function defaultScheduleDay(frequency: Frequency, fromMs = Date.now()): number {
  if (frequency === 'weekly') {
    return isoWeekday(new Date(fromMs));
  }
  return new Date(fromMs).getDate();
}

function scheduleOf(rule: RecurringRule): Schedule {
  return {
    frequency: rule.frequency,
    day: rule.scheduleDay,
    count: rule.intervalCount ?? 1,
    unit: rule.intervalUnit ?? 'day',
  };
}

export async function createRecurringRule(
  db: Database,
  input: RecurringInput,
): Promise<RecurringRule> {
  if (input.kind !== 'expense' && input.kind !== 'income') {
    throw new Error(`Recurring kind must be expense or income, got: ${input.kind}`);
  }
  const now = Date.now();
  const needsDay = input.frequency === 'weekly' || input.frequency === 'monthly';
  const day = needsDay ? input.scheduleDay ?? defaultScheduleDay(input.frequency, now) : undefined;
  const schedule: Schedule = {
    frequency: input.frequency,
    day,
    count: input.intervalCount ?? 1,
    unit: input.intervalUnit ?? 'day',
  };
  const nextRun = input.nextRun ?? advanceSchedule(schedule, now);

  return db.write(async () =>
    db.get<RecurringRule>('recurring_rules').create(r => {
      r.accountId = input.accountId;
      r.categoryId = input.categoryId;
      r.kind = input.kind;
      r.amountCents = input.amountCents;
      r.note = (input.note ?? '').trim();
      r.frequency = input.frequency;
      if (day !== undefined) {
        r.scheduleDay = day;
      }
      if (input.frequency === 'custom') {
        r.intervalCount = Math.max(Math.round(input.intervalCount ?? 1), 1);
        r.intervalUnit = input.intervalUnit ?? 'day';
      }
      r.nextRun = nextRun;
      r.active = true;
      r.createdAt = now;
      r.updatedAt = now;
    }),
  );
}

export async function deleteRecurringRule(db: Database, id: string): Promise<void> {
  await db.write(async () => {
    const rule = await db.get<RecurringRule>('recurring_rules').find(id);
    await rule.destroyPermanently();
  });
}

/**
 * Crea las transacciones de las reglas vencidas y avanza next_run respetando
 * el día/intervalo configurado. Devuelve cuántas transacciones se generaron.
 */
export async function runDueRecurring(db: Database, now = Date.now()): Promise<number> {
  const rules = await db
    .get<RecurringRule>('recurring_rules')
    .query(Q.where('active', true), Q.where('next_run', Q.lte(now)))
    .fetch();

  let created = 0;
  for (const rule of rules) {
    const schedule = scheduleOf(rule);
    let runAt = rule.nextRun;
    let guard = 0;
    try {
      while (runAt <= now && guard < MAX_CATCHUP) {
        await createTransaction(db, {
          accountId: rule.accountId,
          categoryId: rule.categoryId,
          kind: rule.kind,
          amountCents: rule.amountCents,
          note: rule.note,
          occurredOn: runAt,
        });
        runAt = advanceSchedule(schedule, runAt);
        created += 1;
        guard += 1;
      }
    } catch (error) {
      console.error('[recurring] failed for rule', rule.id, error);
    }
    await db.write(() =>
      rule.update(r => {
        r.nextRun = runAt;
        r.updatedAt = Date.now();
      }),
    );
  }
  return created;
}
