import { describe, expect, it, beforeEach } from '@jest/globals';
import { clearPin, hasPin, setPin, verifyPin } from '../../src/security/pin';

describe('pin', () => {
  beforeEach(() => clearPin());

  it('stores and verifies a 4-digit pin', () => {
    expect(hasPin()).toBe(false);
    setPin('1234');
    expect(hasPin()).toBe(true);
    expect(verifyPin('1234')).toBe(true);
    expect(verifyPin('0000')).toBe(false);
  });

  it('rejects malformed pins', () => {
    expect(() => setPin('12')).toThrow();
    expect(() => setPin('abcd')).toThrow();
  });

  it('clears the pin', () => {
    setPin('1234');
    clearPin();
    expect(hasPin()).toBe(false);
    expect(verifyPin('1234')).toBe(false);
  });
});
