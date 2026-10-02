import { StyleSheet } from 'react-native';
import { spacing, type Palette } from '../../theme';

export const makeStyles = (c: Palette) =>
  StyleSheet.create({
    empty: { textAlign: 'center', color: c.muted, marginTop: spacing.xl + spacing.md },
  });
