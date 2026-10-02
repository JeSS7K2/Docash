import { StyleSheet } from 'react-native';
import { spacing, type, type Palette } from '../../theme';

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
    profile: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    logo: { width: 32, height: 32 },
    name: { fontSize: type.bodySize, color: c.ink, fontWeight: '600' },
    iconButton: {
      minWidth: 44,
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
