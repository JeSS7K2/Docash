import { StyleSheet } from 'react-native';
import { radius } from '../../theme';
import type { Palette } from '../../theme';

export const makeStyles = (c: Palette) =>
  StyleSheet.create({
    grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12 },
    key: {
      width: '31%',
      margin: '1.16%',
      aspectRatio: 1.6,
      borderRadius: radius.action,
      backgroundColor: c.faint,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 56,
    },
    digit: { fontSize: 26, fontWeight: '600', color: c.ink },
  });
