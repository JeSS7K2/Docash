import { StyleSheet } from 'react-native';
import { radius, spacing, type, type Palette } from '../../theme';

export const makeStyles = (c: Palette) =>
  StyleSheet.create({
    body: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
    summaryGrid: { flexDirection: 'row', gap: spacing.sm },
    summaryCard: { flex: 1, minHeight: 90, borderRadius: radius.action, backgroundColor: c.primarySoft, alignItems: 'center', justifyContent: 'center', padding: spacing.sm },
    summaryValue: { color: c.primary, fontSize: 28, fontWeight: '800' },
    summaryLabel: { color: c.muted, fontSize: 12, fontWeight: '700', textAlign: 'center', marginTop: spacing.xs },
    section: { color: c.ink, fontSize: type.actionSize, fontWeight: '800', marginTop: spacing.xl, marginBottom: spacing.md },
    week: { flexDirection: 'row', justifyContent: 'space-between' },
    day: { alignItems: 'center', gap: spacing.xs, flex: 1 },
    dayDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: c.faint, alignItems: 'center', justifyContent: 'center' },
    confirmed: { backgroundColor: c.primary },
    rest: { backgroundColor: c.track },
    missed: { backgroundColor: c.expenseSoft },
    dayLabel: { color: c.ink, fontSize: 12, fontWeight: '800' },
    dayStatus: { color: c.muted, fontSize: 10, textAlign: 'center' },
    helper: { color: c.muted, fontSize: type.metaSize, lineHeight: 20, marginTop: spacing.md },
    milestone: { minHeight: 48, borderBottomWidth: 1, borderBottomColor: c.border, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    milestoneText: { color: c.ink, fontSize: type.bodySize, fontWeight: '700' },
    settingsButton: { minHeight: 48, marginTop: spacing.xl, borderWidth: 1, borderColor: c.primary, borderRadius: radius.action, alignItems: 'center', justifyContent: 'center' },
    settingsText: { color: c.primary, fontSize: type.bodySize, fontWeight: '800' },
  });
