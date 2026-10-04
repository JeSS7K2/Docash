import { StyleSheet } from 'react-native';
import { spacing, type, type Palette } from '../../theme';

export const makeStyles = (c: Palette) =>
  StyleSheet.create({
    root: { alignItems: 'flex-start', paddingTop: spacing.xs },
    heroRoot: { paddingTop: spacing.xs },
    label: { fontSize: type.bodySize, color: c.muted },
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
    accountName: { fontSize: 14, color: c.muted },
    heroText: { color: '#FFFFFF' },
    heroMuted: { color: '#E1E7FF' },
  });
