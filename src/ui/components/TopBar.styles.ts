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
      minHeight: 42,
    },
    title: { fontSize: 20, color: c.ink, fontWeight: '800' },
    settingsText: { fontSize: type.metaSize, fontWeight: '600' },
    iconButton: {
      minWidth: 44,
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
