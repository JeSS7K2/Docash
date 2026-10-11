import { StyleSheet } from 'react-native';
import { radius, spacing, type, type Palette } from '../../theme';

export const makeStyles = (c: Palette) =>
  StyleSheet.create({
    card: { backgroundColor: c.primarySoft, borderRadius: radius.action, padding: spacing.lg, marginTop: spacing.lg },
    header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    iconBubble: { width: 48, height: 48, borderRadius: 24, backgroundColor: c.paper, alignItems: 'center', justifyContent: 'center' },
    copy: { flex: 1 },
    title: { color: c.ink, fontSize: type.actionSize, fontWeight: '800' },
    body: { color: c.muted, fontSize: type.metaSize, lineHeight: 20, marginTop: spacing.xs },
    week: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.lg },
    day: { alignItems: 'center', gap: spacing.xs },
    dayDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: c.faint, alignItems: 'center', justifyContent: 'center' },
    dayConfirmed: { backgroundColor: c.primary },
    dayRest: { backgroundColor: c.track },
    dayLabel: { color: c.muted, fontSize: 12, fontWeight: '700' },
    actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
    primaryButton: { flex: 1, minHeight: 44, backgroundColor: c.primary, borderRadius: radius.action, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.md },
    primaryButtonText: { color: c.onAction, fontSize: type.metaSize, fontWeight: '800', textAlign: 'center' },
    secondaryButton: { minHeight: 44, borderWidth: 1, borderColor: c.primary, borderRadius: radius.action, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.md },
    secondaryButtonText: { color: c.primary, fontSize: type.metaSize, fontWeight: '800' },
  });
