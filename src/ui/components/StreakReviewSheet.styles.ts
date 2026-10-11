import { StyleSheet } from 'react-native';
import { radius, spacing, type, type Palette } from '../../theme';

export const makeStyles = (c: Palette) =>
  StyleSheet.create({
    body: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
    warning: { color: c.expense, backgroundColor: c.expenseSoft, borderRadius: radius.action, padding: spacing.md, lineHeight: 20 },
    date: { color: c.ink, fontSize: 26, fontWeight: '800', marginTop: spacing.sm, marginBottom: spacing.lg },
    summaryRow: { flexDirection: 'row', gap: spacing.md },
    summaryCard: { flex: 1, minHeight: 58, padding: spacing.md, borderRadius: radius.action, backgroundColor: c.faint, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    summaryText: { color: c.ink, fontSize: type.metaSize, fontWeight: '700', flexShrink: 1 },
    transactionRow: { minHeight: 64, borderBottomWidth: 1, borderBottomColor: c.border, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    transactionCopy: { flex: 1 },
    transactionTitle: { color: c.ink, fontSize: type.bodySize, fontWeight: '700' },
    transactionMeta: { color: c.muted, fontSize: type.metaSize, marginTop: spacing.xs },
    transactionAmount: { fontSize: type.bodySize, fontWeight: '800' },
    emptyCard: { minHeight: 116, backgroundColor: c.primarySoft, borderRadius: radius.action, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md },
    emptyTitle: { color: c.ink, fontSize: type.bodySize, textAlign: 'center', lineHeight: 22 },
    question: { color: c.ink, fontSize: type.actionSize, fontWeight: '800', marginTop: spacing.xl },
    addMovement: { minHeight: 48, marginTop: spacing.md, borderWidth: 1, borderColor: c.primary, borderRadius: radius.action, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
    addMovementText: { color: c.primary, fontSize: type.bodySize, fontWeight: '800' },
    confirmButton: { minHeight: 56, marginTop: spacing.md, borderRadius: radius.action, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center' },
    confirmButtonText: { color: c.onAction, fontSize: type.actionSize, fontWeight: '800' },
    confirmedCard: { minHeight: 56, marginTop: spacing.xl, borderRadius: radius.action, backgroundColor: c.incomeSoft, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.md },
    confirmedText: { color: c.income, fontSize: type.bodySize, fontWeight: '800' },
    newSinceReview: { color: c.muted, fontSize: type.metaSize, lineHeight: 20, marginTop: spacing.md, textAlign: 'center' },
    disabled: { opacity: 0.5 },
  });
