import { StyleSheet } from 'react-native';
import { spacing, type Palette } from '../../theme';

export const makeStyles = (c: Palette) =>
  StyleSheet.create({
    root: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.lg,
      minHeight: 60,
    },
    rootFlush: { paddingHorizontal: 0 },
    title: { fontSize: 34, lineHeight: 40, color: c.ink, fontWeight: '800' },
    iconButton: {
      minWidth: 44,
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
