import { StyleSheet } from 'react-native';
import { spacing, type Palette } from '../../theme';

export const makeStyles = (c: Palette) =>
  StyleSheet.create({
    root: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.md,
      minHeight: 48,
    },
    rootFlush: { paddingHorizontal: 0 },
    title: { fontSize: 20, lineHeight: 24, color: c.ink, fontWeight: '800' },
    iconButton: {
      minWidth: 44,
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
