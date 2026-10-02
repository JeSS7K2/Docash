/**
 * LockScreen: teclear el PIN correcto desbloquea. verifyPin se mockea para
 * aislar la UI del almacenamiento.
 */
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';
import LockScreen from '../src/ui/LockScreen';

jest.mock('@gluestack-ui/themed', () => jest.requireActual('../helpers/gluestackMock'));

jest.mock('../src/security/pin', () => ({
  hasPin: () => true,
  verifyPin: (pin: string) => pin === '1234',
  setPin: jest.fn(),
  clearPin: jest.fn(),
}));

describe('LockScreen', () => {
  it('unlocks when the correct PIN is entered', () => {
    const onUnlock = jest.fn();
    const screen = render(<LockScreen onUnlock={onUnlock} />);

    for (const d of ['1', '2', '3', '4']) {
      fireEvent.press(screen.getByTestId(`num-${d}`));
    }
    expect(onUnlock).toHaveBeenCalled();
  });

  it('does not unlock with a wrong PIN', () => {
    const onUnlock = jest.fn();
    const screen = render(<LockScreen onUnlock={onUnlock} />);
    for (const d of ['9', '9', '9', '9']) {
      fireEvent.press(screen.getByTestId(`num-${d}`));
    }
    expect(onUnlock).not.toHaveBeenCalled();
  });
});
