import { StyleSheet } from 'react-native';
import { spacing, type, type Palette } from '../theme';

export const makeStyles = (c: Palette) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.paper, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 20, fontWeight: '800', color: c.ink, marginBottom: spacing.md },
    subtitle: { fontSize: type.bodySize, color: c.muted, marginBottom: spacing.xl },
    dots: { flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.xl },
    dot: {
      width: 16,
      height: 16,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: c.ink,
    },
    dotFilled: { backgroundColor: c.ink },
    error: { color: c.expense, fontSize: type.bodySize, marginBottom: spacing.md },
    biometric: {
      marginTop: spacing.lg,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
      borderRadius: 14,
      backgroundColor: c.faint,
      minHeight: 44,
      justifyContent: 'center',
    },
    biometricText: { color: c.ink, fontWeight: '600' },
  });
