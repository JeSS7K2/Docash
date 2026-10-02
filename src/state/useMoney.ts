import { useCallback } from 'react';
import { useSettings } from './useSettings';
import { intlLocale } from '../i18n';
import { formatCents } from '../utils/currency';

/** Formateador de dinero reactivo a moneda y locale. Conversión 1:1. */
export function useMoney(): (cents: number) => string {
  const currency = useSettings(s => s.currency);
  const locale = useSettings(s => s.locale);
  return useCallback(
    (cents: number) => formatCents(cents, currency, intlLocale(locale)),
    [currency, locale],
  );
}
