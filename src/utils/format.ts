import { intlLocale } from '../i18n';
import type { Locale } from '../state/useSettings';

/** Fecha + hora localizada, p.ej. "Oct 01, 14:30". */
export function formatDateTime(ms: number, locale: Locale): string {
  return new Date(ms).toLocaleString(intlLocale(locale), {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDate(ms: number, locale: Locale): string {
  return new Date(ms).toLocaleDateString(intlLocale(locale), {
    day: '2-digit',
    month: 'short',
  });
}
