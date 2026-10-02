import { MMKV } from 'react-native-mmkv';
import { Q, type Database } from '@nozbe/watermelondb';
import { useSettings } from '../state/useSettings';
import { intlLocale, translate, type TranslationKey } from '../i18n';
import { getBudgets } from '../db/budgets';
import { getGoals, getGoalProgressCents } from '../db/goals';
import { getCategorySpentInRange } from '../db/queries';
import { formatCents } from '../utils/currency';
import { monthKeyFromEpoch } from '../utils/currency';
import { budgetWindow } from '../utils/schedule';
import { playSound } from '../services/sound';
import type Category from '../db/models/Category';
import type RecurringRule from '../db/models/RecurringRule';
import type Transaction from '../db/models/Transaction';
import {
  cancelDailyReminder,
  cancelRecurringReminder,
  cancelWeeklySummary,
  notifyNow,
  recurringReminderAt,
  scheduleDailyReminder,
  scheduleRecurringReminder,
  scheduleWeeklySummary,
} from './reminders';

const store = new MMKV({ id: 'docash-notif' });
const dayKey = () => new Date().toISOString().slice(0, 10);

async function categoriesById(db: Database): Promise<Map<string, Category>> {
  const cats = await db.get<Category>('categories').query().fetch();
  return new Map(cats.map(c => [c.id, c]));
}

function catName(byId: Map<string, Category>, id: string, locale: 'en' | 'es'): string {
  const key = `category.${id}` as TranslationKey;
  const translated = translate(locale, key);
  return translated === key ? byId.get(id)?.name ?? id : translated;
}

function money(cents: number, currency: 'USD' | 'EUR', locale: 'en' | 'es'): string {
  return formatCents(cents, currency, intlLocale(locale));
}

/** Programa (o cancela) las notificaciones base: diaria, resumen y recurrentes. */
export async function syncScheduledNotifications(db: Database): Promise<void> {
  const s = useSettings.getState();
  const byId = await categoriesById(db);
  const locale = s.locale;

  // Diaria inteligente.
  if (s.reminderEnabled) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const txs = await db
      .get<Transaction>('transactions')
      .query(Q.where('occurred_on', Q.gte(todayStart.getTime())))
      .fetch();
    const spent = txs.filter(t => t.kind === 'expense').reduce((a, t) => a + t.amountCents, 0);
    const body =
      spent > 0
        ? translate(locale, 'notif.dailySummary', { amount: money(spent, s.currency, locale) })
        : translate(locale, 'notif.dailyNoTx');
    await scheduleDailyReminder(s.reminderHour, 'Docash', body);
  } else {
    await cancelDailyReminder();
  }

  // Resumen semanal.
  if (s.notifySummary) {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const txs = await db
      .get<Transaction>('transactions')
      .query(Q.where('occurred_on', Q.gte(weekAgo)))
      .fetch();
    const net = txs.reduce((a, t) => a + t.amountSigned, 0);
    await scheduleWeeklySummary(
      s.reminderHour,
      'Docash',
      translate(locale, 'notif.summaryBody', { amount: money(net, s.currency, locale) }),
    );
  } else {
    await cancelWeeklySummary();
  }

  // Recurrentes.
  const rules = await db
    .get<RecurringRule>('recurring_rules')
    .query(Q.where('active', true))
    .fetch();
  for (const rule of rules) {
    if (!s.notifyRecurring) {
      await cancelRecurringReminder(rule.id);
      continue;
    }
    const at = recurringReminderAt(rule.nextRun, s.reminderHour);
    if (at > Date.now()) {
      await scheduleRecurringReminder(
        rule.id,
        at,
        'Docash',
        translate(locale, 'reminders.recurringBody', { name: catName(byId, rule.categoryId, locale) }),
      );
    }
  }
}

/** Comprueba umbrales (presupuestos, objetivos, inactividad) y avisa. */
export async function runNotificationChecks(db: Database): Promise<void> {
  const s = useSettings.getState();
  const byId = await categoriesById(db);
  const locale = s.locale;
  const now = Date.now();

  if (s.notifyBudget) {
    const budgets = await getBudgets(db);
    const periodKey = monthKeyFromEpoch(now);
    for (const b of budgets) {
      const target = b.amountCents;
      if (target <= 0) {
        continue;
      }
      const spent = await getCategorySpentInRange(
        db,
        b.categoryId,
        budgetWindow(b.period ?? 'monthly', b.intervalDays ?? 1, b.intervalUnit ?? 'day', now),
      );
      const name = catName(byId, b.categoryId, locale);
      const overKey = `budget-over:${b.id}:${periodKey}`;
      const nearKey = `budget-near:${b.id}:${periodKey}`;
      if (spent >= target && !store.getBoolean(overKey)) {
        await notifyNow(overKey, 'Docash', translate(locale, 'notif.budgetOver', { name }));
        store.set(overKey, true);
        playSound('warning');
      } else if (spent >= target * 0.8 && !store.getBoolean(nearKey)) {
        await notifyNow(nearKey, 'Docash', translate(locale, 'notif.budgetNear', { name }));
        store.set(nearKey, true);
      }
    }
  }

  if (s.notifyGoal) {
    const goals = await getGoals(db);
    for (const g of goals) {
      const progress = await getGoalProgressCents(db, g);
      const reachedKey = `goal-reached:${g.id}`;
      const nearKey = `goal-near:${g.id}`;
      if (progress >= g.targetCents && !store.getBoolean(reachedKey)) {
        await notifyNow(reachedKey, 'Docash', translate(locale, 'notif.goalReached', { name: g.name }));
        store.set(reachedKey, true);
        playSound('goal');
      } else if (progress >= g.targetCents * 0.8 && !store.getBoolean(nearKey)) {
        await notifyNow(nearKey, 'Docash', translate(locale, 'notif.goalNear', { name: g.name }));
        store.set(nearKey, true);
      }
    }
  }

  if (s.notifyInactive) {
    const last = await db
      .get<Transaction>('transactions')
      .query(Q.sortBy('occurred_on', Q.desc), Q.take(1))
      .fetch();
    const lastMs = last.length > 0 ? last[0].occurredOn : s.installedAt || now;
    const days = (now - lastMs) / (24 * 60 * 60 * 1000);
    const key = `inactive:${dayKey()}`;
    if (days >= s.inactivityDays && !store.getBoolean(key)) {
      await notifyNow(key, 'Docash', translate(locale, 'notif.inactiveBody'));
      store.set(key, true);
    }
  }
}
