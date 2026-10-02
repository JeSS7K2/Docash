import { StyleSheet } from 'react-native';
import { radius, spacing, type, type Palette } from '../../theme';

export const makeStyles = (c: Palette) =>
  StyleSheet.create({
    root: { paddingHorizontal: spacing.xl, marginBottom: spacing.md },
    nav: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.lg,
      marginBottom: spacing.md,
      minHeight: 32,
    },
    navButton: {
      padding: spacing.sm,
      minWidth: 44,
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    navButtonHidden: { opacity: 0 },
    label: { fontSize: type.titleSize, fontWeight: type.titleWeight, color: c.ink },
    chips: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'center' },
    chip: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.action,
      backgroundColor: c.faint,
      minHeight: 36,
      justifyContent: 'center',
    },
    chipActive: { backgroundColor: c.ink },
    chipText: { fontSize: type.metaSize, color: c.ink },
    chipTextActive: { color: c.paper },
  });
