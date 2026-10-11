import { StyleSheet } from 'react-native';
import { radius, spacing } from '../../theme';
import type { Palette } from '../../theme';

export const makeStyles = (c: Palette) =>
  StyleSheet.create({
    grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.xl, justifyContent: 'space-between', marginBottom: 32 },
    key: {
      width: '31.5%',
      aspectRatio: 2.1,
      borderRadius: radius.action,
      backgroundColor: c.faint,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 56,
    },
    digit: { fontSize: 28, fontWeight: '700', color: c.ink },
  });
