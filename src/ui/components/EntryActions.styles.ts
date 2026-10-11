import { StyleSheet } from 'react-native';
import { radius, spacing, type, type Palette } from '../../theme';

export const makeStyles = (c: Palette) =>
  StyleSheet.create({
    root: { paddingVertical: spacing.md },
    action: {
      borderRadius: radius.action,
      paddingVertical: spacing.lg,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: spacing.md,
      minHeight: 62,
      backgroundColor: c.primary,
    },
    plusCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
    label: { color: '#FFFFFF', fontSize: 21, fontWeight: type.actionWeight },
  });
