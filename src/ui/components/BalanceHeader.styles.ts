import { StyleSheet } from 'react-native';
import { spacing, type, type Palette } from '../../theme';

export const makeStyles = (c: Palette) =>
  StyleSheet.create({
    root: { alignItems: 'flex-start', paddingTop: spacing.xs },
    heroRoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 0, minHeight: 108 },
    heroContent: { flex: 1 },
    label: { fontSize: 18, color: c.muted },
    balance: {
      fontSize: type.balanceSize,
      fontWeight: type.balanceWeight,
      color: c.ink,
      marginTop: spacing.xs,
    },
    account: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    heroAccount: { marginTop: 0, gap: spacing.md, maxWidth: '48%' },
    accountName: { fontSize: 16, color: c.muted },
    heroText: { color: '#FFFFFF' },
    heroMuted: { color: '#E1E7FF' },
  });
