import { StyleSheet } from 'react-native';
import { radius, spacing, type, type Palette } from '../../theme';

export const makeStyles = (c: Palette) =>
  StyleSheet.create({
    body: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
    toggleRow: { minHeight: 60, backgroundColor: c.faint, borderRadius: radius.action, paddingHorizontal: spacing.lg, marginTop: spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
    copy: { flex: 1 },
    title: { color: c.ink, fontSize: type.bodySize, fontWeight: '800' },
    bodyText: { color: c.muted, fontSize: type.metaSize, lineHeight: 19, marginTop: spacing.xs },
    label: { color: c.ink, fontSize: type.bodySize, fontWeight: '700', flex: 1 },
    zone: { color: c.muted, fontSize: type.metaSize, marginTop: spacing.lg },
    section: { color: c.muted, fontSize: type.metaSize, fontWeight: '700', marginTop: spacing.lg, marginBottom: spacing.md, textTransform: 'uppercase' },
    input: { minHeight: 48, borderWidth: 1, borderColor: c.border, borderRadius: radius.action, paddingHorizontal: spacing.lg, color: c.ink, fontSize: type.bodySize },
  });
