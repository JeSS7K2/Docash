import { describe, expect, it } from '@jest/globals';
import { en, es } from '../src/i18n/translations';

describe('i18n dictionaries', () => {
  it('es covers every en key with a non-empty string', () => {
    const missing = Object.keys(en).filter(k => !(k in es));
    expect(missing).toEqual([]);
    for (const k of Object.keys(es) as (keyof typeof es)[]) {
      expect(es[k].length).toBeGreaterThan(0);
    }
  });
});
