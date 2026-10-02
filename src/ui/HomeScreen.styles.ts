import { StyleSheet } from 'react-native';
import { type Palette } from '../theme';

export const makeStyles = (c: Palette) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.paper },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.paper },
    compare: {
      textAlign: 'center',
      fontSize: 12,
      fontWeight: '600',
      marginBottom: 8,
    },
  });
