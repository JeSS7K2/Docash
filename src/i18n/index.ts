import { useCallback } from 'react';
import { useSettings } from '../state/useSettings';
import { dictionaries, type TranslationKey } from './translations';

export type { TranslationKey } from './translations';
export { dictionaries } from './translations';

/** Locale BCP-47 para Intl (números/fechas). */
export function intlLocale(locale: 'en' | 'es'): string {
  return locale === 'es' ? 'es-ES' : 'en-US';
}

export function translate(
  locale: 'en' | 'es',
  key: TranslationKey,
  params?: Record<string, string | number>,
): string {
  const dict = dictionaries[locale] ?? dictionaries.en;
  let value: string = dict[key] ?? dictionaries.en[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      value = value.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
    }
  }
  return value;
}

export function useTranslation() {
  const locale = useSettings(s => s.locale);
  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>) =>
      translate(locale, key, params),
    [locale],
  );
  return { t, locale, intl: intlLocale(locale) };
}
