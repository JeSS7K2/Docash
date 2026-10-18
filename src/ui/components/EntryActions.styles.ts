import { StyleSheet } from 'react-native';
import { radius, spacing, type, type Palette } from '../../theme';

export const makeStyles = (c: Palette) =>
  StyleSheet.create({
    root: { paddingVertical: spacing.md },
    action: {
      borderRadius: radius.action,
      paddingVertical: spacing.md,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: spacing.md,
      minHeight: 46,
      backgroundColor: c.primary,
    },
    plusCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
    label: { color: '#FFFFFF', fontSize: 16, fontWeight: type.actionWeight },
  });
