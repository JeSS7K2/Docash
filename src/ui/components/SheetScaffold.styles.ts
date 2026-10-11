import { StyleSheet } from 'react-native';
import { radius, spacing, type Palette } from '../../theme';

export const makeStyles = (c: Palette) =>
  StyleSheet.create({
    page: { flex: 1 },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: c.overlay },
    pageHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16 },
    pageTitle: { fontSize: 34, lineHeight: 40, fontWeight: '800' },
    pageBack: { fontSize: 18, fontWeight: '700' },
    pageHeaderSlot: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    pageScroll: { paddingBottom: 32 },
    content: {
      backgroundColor: c.paper,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingTop: spacing.lg,
      paddingBottom: spacing.xl,
      maxHeight: '92%',
      overflow: 'hidden',
      elevation: 18,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: -6 },
      shadowOpacity: 0.18,
      shadowRadius: 16,
    },
    dragHandle: { width: '100%', alignItems: 'center' },
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
      position: 'relative',
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
