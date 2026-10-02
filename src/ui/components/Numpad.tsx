import React from 'react';
import { Pressable, Text, Vibration, View } from 'react-native';
import { Delete } from 'react-native-feather';
import { useTranslation } from '../../i18n';
import { playSound } from '../../services/sound';
import { usePalette, useThemedStyles } from '../../theme';
import type { NumpadKey } from '../../utils/amountBuffer';
import { makeStyles } from './Numpad.styles';

interface NumpadProps {
  onKey: (key: NumpadKey) => void;
  /** Muestra la tecla "." (oculta para PIN). */
  showDecimal?: boolean;
}

const ROWS: NumpadKey[][] = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['.', '0', 'back'],
];

/**
 * Teclado propietario: sin TextInput ni IME del OS (0ms de apertura).
 * Estado local al padre vía onKey; feedback háptico con Vibration (core).
 */
export default function Numpad({ onKey, showDecimal = true }: NumpadProps) {
  const styles = useThemedStyles(makeStyles);
  const palette = usePalette();
  const { t } = useTranslation();
  const press = (key: NumpadKey) => () => {
    playSound('key');
    Vibration.vibrate(8);
    onKey(key);
  };
  return (
    <View>
      {ROWS.map((row, i) => (
        <View key={i} style={styles.grid}>
          {row
            .filter(key => showDecimal || key !== '.')
            .map(key => (
              <Pressable
                key={key}
                testID={`num-${key}`}
                accessibilityRole="button"
                accessibilityLabel={key === 'back' ? t('entry.delete') : key}
                style={styles.key}
                onPress={press(key)}>
                {key === 'back' ? (
                  <Delete width={26} height={26} color={palette.ink} strokeWidth={2} />
                ) : (
                  <Text style={styles.digit}>{key}</Text>
                )}
              </Pressable>
            ))}
        </View>
      ))}
    </View>
  );
}
