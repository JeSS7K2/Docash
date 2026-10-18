import { StyleSheet } from 'react-native';
import { radius, spacing, type, type Palette } from '../../theme';

export const makeStyles = (c: Palette) =>
  StyleSheet.create({
    body: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm },
    sectionLabel: {
      color: c.muted,
      fontSize: type.metaSize,
      fontWeight: '700',
      textTransform: 'uppercase',
      marginTop: spacing.lg,
      marginBottom: spacing.sm,
    },
    amountCard: {
      backgroundColor: c.faint,
      borderRadius: radius.action,
      padding: spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 84,
    },
    amount: { color: c.ink, fontSize: 30, fontWeight: '800' },
    stepperRow: { flexDirection: 'row', gap: spacing.sm },
    stepper: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: c.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    navRow: {
      backgroundColor: c.faint,
      borderRadius: radius.action,
      paddingHorizontal: spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 56,
    },
    navButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    navValue: { flex: 1, textAlign: 'center', color: c.ink, fontSize: type.bodySize, fontWeight: '600' },
    confirmButton: {
      borderRadius: radius.action,
      minHeight: 50,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: spacing.xl,
    },
    confirmText: { color: '#FFFFFF', fontSize: type.actionSize, fontWeight: '700' },
    disabled: { opacity: 0.5 },
  });
