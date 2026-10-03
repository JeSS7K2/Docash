import type { TranslationKey } from '../i18n';

export function isAmountError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return /amount|importe|cents/i.test(message);
}

export function errorKey(error: unknown, fallback: TranslationKey): TranslationKey {
  return isAmountError(error) ? 'errors.invalidAmount' : fallback;
}
