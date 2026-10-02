import { StyleSheet } from 'react-native';
import { spacing, type, type Palette } from '../../theme';

export const makeStyles = (c: Palette) =>
  StyleSheet.create({
    root: { alignItems: 'center', justifyContent: 'center', marginVertical: spacing.md },
    center: { position: 'absolute', alignItems: 'center' },
    total: { fontSize: 20, fontWeight: '800', color: c.ink },
    month: { fontSize: type.metaSize, color: c.muted, marginTop: spacing.xs },
  });
