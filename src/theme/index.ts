import { useMemo } from 'react';
import { useColorScheme, type StyleSheet } from 'react-native';
import { useSettings, type ThemePreference } from '../state/useSettings';
import { darkPalette, lightPalette, type Palette } from './palette';

export type { Palette } from './palette';
export { lightPalette, darkPalette } from './palette';
export * from './tokens';

/** Tema efectivo resuelto (system -> preferencia del SO). */
export function useThemeName(): 'light' | 'dark' {
  const preference = useSettings(s => s.theme);
  const system = useColorScheme();
  return resolveTheme(preference, system);
}

export function resolveTheme(
  preference: ThemePreference,
  system: 'light' | 'dark' | null | undefined,
): 'light' | 'dark' {
  if (preference === 'system') {
    return system === 'dark' ? 'dark' : 'light';
  }
  return preference;
}

export function usePalette(): Palette {
  const name = useThemeName();
  return name === 'dark' ? darkPalette : lightPalette;
}

/**
 * Memoiza un StyleSheet (o cualquier objeto) por paleta. `factory` debe ser
 * estable a nivel de módulo.
 */
export function useThemedStyles<T extends StyleSheet.NamedStyles<T>>(
  factory: (c: Palette) => T,
): T {
  const palette = usePalette();
  return useMemo(() => factory(palette), [factory, palette]);
}
