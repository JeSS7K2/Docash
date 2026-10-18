import { type Database } from '@nozbe/watermelondb';
import Account from '../db/models/Account';
import Category from '../db/models/Category';
import { getBudgets } from '../db/budgets';
import { getGoalProgressCents, getGoals } from '../db/goals';
import { getStreakState } from '../db/streaks';
import {
  fetchTransactionsInRange,
  getAccountBalance,
  getCategorySpentInRange,
} from '../db/queries';
import { budgetWindow, type BudgetPeriod, type IntervalUnit } from '../utils/schedule';
import { buildDailyFlow } from '../utils/flow';
import { translate, type TranslationKey } from '../i18n';
import { useSettings } from '../state/useSettings';
import type {
  WidgetBudgetDTO,
  WidgetCategoryDTO,
  WidgetFlowPointDTO,
  WidgetGoalDTO,
  WidgetSnapshot,
  WidgetStreakDTO,
} from '../state/widgetData';

function localizedCategory(cat: Category, locale: 'en' | 'es'): string {
  const key = `category.${cat.id}` as TranslationKey;
  const translated = translate(locale, key);
  return translated === key ? cat.name : translated;
}

/** Construye el snapshot que consumen los widgets (se guarda en MMKV). */
export async function buildWidgetSnapshot(db: Database, dark = false): Promise<WidgetSnapshot> {
  const settings = useSettings.getState();
  const { currency, exchangeRate: rate, locale, noteHistory, widgetShowBalance } = settings;
  const now = Date.now();

  const [accounts, categories, budgetRows, goalRows, streakState, txs] = await Promise.all([
    db.get<Account>('accounts').query().fetch(),
    db.get<Category>('categories').query().fetch(),
    getBudgets(db),
    getGoals(db),
    getStreakState(db),
    fetchTransactionsInRange(db, null),
  ]);

  const account = accounts[0] ?? null;
  const balanceCents = account ? await getAccountBalance(db, account) : 0;

  const byId = new Map(categories.map(c => [c.id, c]));

  const budgets: WidgetBudgetDTO[] = [];
  for (const b of budgetRows) {
    const cat = byId.get(b.categoryId);
    budgets.push({
      categoryId: b.categoryId,
      name: cat ? localizedCategory(cat, locale) : b.categoryId,
      spentCents: await getCategorySpentInRange(
        db,
        b.categoryId,
        budgetWindow((b.period ?? 'monthly') as BudgetPeriod, b.intervalDays ?? 1, (b.intervalUnit ?? 'day') as IntervalUnit, now),
      ),
      limitCents: b.amountCents,
      period: b.period ?? 'monthly',
    });
  }

  const goals: WidgetGoalDTO[] = [];
  for (const g of goalRows) {
    goals.push({
      name: g.name,
      targetCents: g.targetCents,
      progressCents: await getGoalProgressCents(db, g),
    });
  }

  const streak: WidgetStreakDTO = {
    enabled: streakState.settings.enabled,
    currentStreak: streakState.summary.currentStreak,
    bestStreak: streakState.summary.bestStreak,
    todayConfirmed: streakState.summary.todayConfirmed,
    week: streakState.week.map(day => ({ label: day.localDate.slice(-2), status: day.status })),
  };

  const todayStart = new Date(now).setHours(0, 0, 0, 0);
  const flowPoints = buildDailyFlow(
    '1Y',
    txs.map(tx => ({ occurredOn: tx.occurredOn, amountCents: tx.amountCents, kind: tx.kind })),
    locale,
    now,
  );
  const flow: WidgetFlowPointDTO[] = flowPoints.map((point, i) => ({
    dayMs: todayStart - (flowPoints.length - 1 - i) * 86400000,
    incomeCents: point.incomeCents,
    expenseCents: point.expenseCents,
  }));

  const widgetCategories: WidgetCategoryDTO[] = categories
    .filter(c => c.id !== 'cat_other_inc')
    .map(c => ({ id: c.id, name: localizedCategory(c, locale), kind: c.kind }));

  return {
    balanceCents,
    currency,
    rate,
    locale,
    showBalance: widgetShowBalance,
    dark,
    budgets,
    goals,
    streak,
    flow,
    categories: widgetCategories,
    notes: noteHistory,
  };
}
