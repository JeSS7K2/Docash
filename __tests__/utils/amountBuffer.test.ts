import { describe, expect, it } from '@jest/globals';
import { applyKey, INITIAL_BUFFER, normalizeBuffer, type NumpadKey } from '../../src/utils/amountBuffer';

function typeAll(keys: NumpadKey[]): string {
  return keys.reduce(applyKey, INITIAL_BUFFER);
}

describe('applyKey', () => {
  it('starts at zero and replaces it', () => {
    expect(applyKey('0', '5')).toBe('5');
  });

  it('types integers and caps at 9 digits', () => {
    expect(typeAll(['1', '0', '0'])).toBe('100');
    expect(typeAll(['1', '2', '3', '4', '5', '6', '7', '8', '9', '9'])).toBe('123456789');
  });

  it('handles one decimal point with max 2 decimals', () => {
    expect(typeAll(['1', '0', '.', '5'])).toBe('10.5');
    expect(typeAll(['.', '5'])).toBe('0.5');
    expect(typeAll(['1', '.', '2', '5', '9'])).toBe('1.25');
    expect(typeAll(['1', '.', '.'])).toBe('1.');
  });

  it('deletes back to zero', () => {
    expect(applyKey('10.5', 'back')).toBe('10.');
    expect(applyKey('5', 'back')).toBe('0');
    expect(applyKey('0', 'back')).toBe('0');
  });
});

describe('normalizeBuffer', () => {
  it('normalizes native keyboard input to the supported amount format', () => {
    expect(normalizeBuffer('0012,345')).toBe('12.34');
    expect(normalizeBuffer('')).toBe('0');
  });
});
