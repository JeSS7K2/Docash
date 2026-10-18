import { StyleSheet } from 'react-native';
import { radius, spacing, type, type Palette } from '../../theme';

export const makeStyles = (c: Palette) =>
  StyleSheet.create({
    card: { backgroundColor: c.primarySoft, borderRadius: radius.action, padding: spacing.lg },
    header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    iconBubble: { width: 40, height: 40, borderRadius: 20, backgroundColor: c.paper, alignItems: 'center', justifyContent: 'center' },
    copy: { flex: 1 },
    title: { color: c.ink, fontSize: type.actionSize, fontWeight: '800' },
    body: { color: c.muted, fontSize: type.metaSize, lineHeight: 18, marginTop: spacing.xs },
    week: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md },
    day: { alignItems: 'center', gap: spacing.xs },
    dayDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: c.faint, alignItems: 'center', justifyContent: 'center' },
    dayConfirmed: { backgroundColor: c.primary },
    dayRest: { backgroundColor: c.track },
    dayLabel: { color: c.muted, fontSize: 11, fontWeight: '700' },
    actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
    primaryButton: { flex: 1, minHeight: 40, backgroundColor: c.primary, borderRadius: radius.action, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.md },
    primaryButtonText: { color: c.onAction, fontSize: type.metaSize, fontWeight: '800', textAlign: 'center' },
    secondaryButton: { minHeight: 40, borderWidth: 1, borderColor: c.primary, borderRadius: radius.action, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.md },
    secondaryButtonText: { color: c.primary, fontSize: type.metaSize, fontWeight: '800' },
  });
