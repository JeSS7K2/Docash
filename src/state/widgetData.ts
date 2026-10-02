import { MMKV } from 'react-native-mmkv';
import { formatCents } from '../utils/currency';
import { baseToDisplayCents } from '../utils/fx';
import { useSettings, type Currency, type Locale } from './useSettings';

// Snapshot para el widget Android. El widget corre en un contexto headless y
// no puede tocar SQLite con fiabilidad: guardamos el balance ya calculado.
const store = new MMKV({ id: 'docash-widget' });
const KEY = 'snapshot';

interface WidgetSnapshot {
  balanceCents: number;
  currency: Currency;
  rate: number;
  locale: Locale;
}

export function saveWidgetSnapshot(balanceCents: number): void {
  const { currency, exchangeRate, locale } = useSettings.getState();
  const snapshot: WidgetSnapshot = { balanceCents, currency, rate: exchangeRate, locale };
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

export function formatWidgetBalance(snapshot: WidgetSnapshot | null): string {
  if (!snapshot) {
    return '—';
  }
  return formatCents(
    baseToDisplayCents(snapshot.balanceCents, snapshot.currency, snapshot.rate),
    snapshot.currency,
    snapshot.locale === 'es' ? 'es-ES' : 'en-US',
  );
}
