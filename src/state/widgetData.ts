import { MMKV } from 'react-native-mmkv';
import { formatCents } from '../utils/currency';
import { baseToDisplayCents } from '../utils/fx';
import type { Currency, Locale } from './useSettings';

// Snapshot para los widgets Android. El widget corre en un contexto headless
// que NO puede tocar SQLite con fiabilidad: la app guarda aquí lo ya calculado
// y el widget solo lee MMKV (síncrono).
const store = new MMKV({ id: 'docash-widget' });
const KEY = 'snapshot';

export interface WidgetBudgetDTO {
  categoryId: string;
  name: string;
  spentCents: number;
  limitCents: number;
  period: string;
}

export interface WidgetGoalDTO {
  name: string;
  targetCents: number;
  progressCents: number;
}

export interface WidgetStreakDayDTO {
  label: string;
  status: string;
}

export interface WidgetStreakDTO {
  enabled: boolean;
  currentStreak: number;
  bestStreak: number;
  todayConfirmed: boolean;
  week: WidgetStreakDayDTO[];
}

export interface WidgetFlowPointDTO {
  dayMs: number;
  incomeCents: number;
  expenseCents: number;
}

export interface WidgetCategoryDTO {
  id: string;
  name: string;
  kind: string;
}

export interface WidgetSnapshot {
  balanceCents: number;
  currency: Currency;
  rate: number;
  locale: Locale;
  showBalance: boolean;
  /** Tema activo (para que el widget combine con la app). */
  dark: boolean;
  budgets: WidgetBudgetDTO[];
  goals: WidgetGoalDTO[];
  streak: WidgetStreakDTO | null;
  /** Serie diaria del último año para el gráfico del widget. */
  flow: WidgetFlowPointDTO[];
  categories: WidgetCategoryDTO[];
  /** Historial de notas para el "comentario" rápido. */
  notes: string[];
}

export function saveWidgetSnapshot(snapshot: WidgetSnapshot): void {
  store.set(KEY, JSON.stringify(snapshot));
}

export function readWidgetSnapshot(): WidgetSnapshot | null {
  const raw = store.getString(KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as WidgetSnapshot;
  } catch {
    return null;
  }
}

export function formatWidgetMoney(
  baseCents: number,
  currency: Currency,
  rate: number,
  locale: Locale,
): string {
  return formatCents(
    baseToDisplayCents(baseCents, currency, rate),
    currency,
    locale === 'es' ? 'es-ES' : 'en-US',
  );
}

export function formatWidgetBalance(snapshot: WidgetSnapshot | null): string {
  if (!snapshot) {
    return '—';
  }
  return formatWidgetMoney(snapshot.balanceCents, snapshot.currency, snapshot.rate, snapshot.locale);
}
