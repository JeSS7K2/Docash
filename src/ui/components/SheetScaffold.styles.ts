import { StyleSheet } from 'react-native';
import { radius, spacing, type Palette } from '../../theme';

export const makeStyles = (c: Palette) =>
  StyleSheet.create({
    backdrop: { backgroundColor: c.overlay },
    content: {
      backgroundColor: c.paper,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingTop: spacing.lg,
      paddingBottom: spacing.xl,
      maxHeight: '92%',
    },
    sheetInner: { flexShrink: 1 },
    scrollBody: { paddingBottom: spacing.md },
    accentBar: {
      width: 44,
      height: 4,
      borderRadius: 2,
      alignSelf: 'center',
      marginBottom: spacing.md,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginHorizontal: spacing.xl,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
      borderRadius: radius.action,
    },
    title: { fontSize: 16, fontWeight: '800' },
    iconButton: {
      minWidth: 44,
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
