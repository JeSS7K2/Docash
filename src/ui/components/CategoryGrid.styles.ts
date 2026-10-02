import { StyleSheet } from 'react-native';
import { radius, spacing, type, type Palette } from '../../theme';

export const makeStyles = (c: Palette) =>
  StyleSheet.create({
    grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.lg },
    cell: {
      width: '23%',
      margin: '1%',
      aspectRatio: 0.85,
      borderRadius: radius.action,
      backgroundColor: c.faint,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.md,
      minHeight: 76,
    },
    name: {
      fontSize: type.metaSize,
      color: c.ink,
      marginTop: spacing.md,
      textAlign: 'center',
    },
  });
