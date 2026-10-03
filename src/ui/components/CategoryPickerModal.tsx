import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Pressable } from '@gluestack-ui/themed';
import type Category from '../../db/models/Category';
import type { CategoryKind } from '../../db/models/Category';
import { useTranslation, type TranslationKey } from '../../i18n';
import { radius, spacing, type, usePalette } from '../../theme';
import { CATEGORY_ICON_OPTIONS, CategoryIcon, type FeatherName } from '../icons';
import SheetScaffold from './SheetScaffold';

interface CategoryPickerModalProps {
  visible: boolean;
  onClose: () => void;
  categories: Category[];
  selectedId: string | null;
  kind: CategoryKind;
  onSelect: (categoryId: string) => void;
  onCreate: (name: string, icon: FeatherName) => Promise<boolean>;
}

export default function CategoryPickerModal({
  visible,
  onClose,
  categories,
  selectedId,
  kind,
  onSelect,
  onCreate,
}: CategoryPickerModalProps) {
  const palette = usePalette();
  const { t } = useTranslation();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState<FeatherName>('Circle');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!visible) {
      setCreating(false);
      setName('');
      setIcon('Circle');
      setSearch('');
    }
  }, [visible]);

  const labelFor = (category: Category) => {
    const key = `category.${category.id}` as TranslationKey;
    const translated = t(key);
    return translated === key ? category.name : translated;
  };

  const add = async () => {
    if (await onCreate(name, icon)) {
      onClose();
    }
  };

  const accent = kind === 'income' ? palette.income : palette.expense;
  const accentSoft = kind === 'income' ? palette.incomeSoft : palette.expenseSoft;
  const filteredCategories = categories.filter(category =>
    labelFor(category).toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()),
  );

  return (
    <SheetScaffold
      isOpen={visible}
      onClose={onClose}
      title={
        creating
          ? t('entry.addCategory')
          : kind === 'income'
            ? t('entry.selectIncomeCategory')
            : t('entry.selectCategory')
      }
      accent={accent}
      accentSoft={accentSoft}
      fixedContent={
        !creating ? (
          <View style={styles.searchWrap}>
            <TextInput
              testID="category-search"
              value={search}
              onChangeText={setSearch}
              placeholder={t('entry.searchCategory')}
              placeholderTextColor={palette.muted}
              style={[styles.input, { borderColor: palette.border, color: palette.ink }]}
              autoCorrect={false}
              returnKeyType="search"
            />
          </View>
        ) : null
      }
      scrollTestID="category-picker-list">
      {creating ? (
        <View style={styles.body}>
          <TextInput
            testID="category-name"
            style={[styles.input, { borderColor: palette.border, color: palette.ink }]}
            value={name}
            onChangeText={setName}
            placeholder={t('entry.categoryName')}
            placeholderTextColor={palette.muted}
            maxLength={32}
            autoFocus
          />
          <Text style={[styles.label, { color: palette.muted }]}>{t('entry.chooseIcon')}</Text>
          <View style={styles.iconGrid}>
            {CATEGORY_ICON_OPTIONS.map(option => (
              <Pressable
                key={option}
                testID={`category-icon-${option}`}
                accessibilityRole="button"
                accessibilityState={{ selected: icon === option }}
                style={[
                  styles.iconButton,
                  { backgroundColor: icon === option ? palette.ink : palette.faint },
                ]}
                onPress={() => setIcon(option)}>
                <CategoryIcon icon={option} color={icon === option ? palette.paper : palette.ink} size={20} />
              </Pressable>
            ))}
          </View>
          <View style={styles.actions}>
            <Pressable
              style={[styles.action, { backgroundColor: palette.faint }]}
              onPress={() => setCreating(false)}>
              <Text style={[styles.actionText, { color: palette.ink }]}>{t('common.cancel')}</Text>
            </Pressable>
            <Pressable
              testID="category-create"
              disabled={!name.trim()}
              style={[styles.action, { backgroundColor: palette.primary }, !name.trim() && styles.disabled]}
              onPress={add}>
              <Text style={styles.primaryText}>{t('entry.addCategory')}</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={styles.body}>
          {filteredCategories.length ? filteredCategories.map(category => {
            const selected = selectedId === category.id;
            return (
              <Pressable
                key={category.id}
                testID={`category-option-${category.id}`}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                style={[styles.row, { backgroundColor: selected ? palette.ink : palette.faint }]}
                onPress={() => {
                  onSelect(category.id);
                  onClose();
                }}>
                <CategoryIcon
                  id={category.id}
                  icon={category.icon}
                  color={selected ? palette.paper : palette.ink}
                  size={22}
                />
                <Text style={[styles.rowText, { color: selected ? palette.paper : palette.ink }]}>
                  {labelFor(category)}
                </Text>
              </Pressable>
            );
          }) : (
            <Text style={[styles.empty, { color: palette.muted }]}>{t('entry.noCategoriesFound')}</Text>
          )}
          <Pressable
            testID="category-add"
            style={[styles.addButton, { borderColor: palette.border }]}
            onPress={() => setCreating(true)}>
            <Text style={[styles.addText, { color: palette.primary }]}>{`＋ ${t('entry.addCategory')}`}</Text>
          </Pressable>
        </View>
      )}
    </SheetScaffold>
  );
}

const styles = StyleSheet.create({
  searchWrap: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.sm },
  body: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.lg },
  row: {
    minHeight: 52,
    borderRadius: radius.action,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  rowText: { fontSize: type.bodySize, fontWeight: '600' },
  empty: { textAlign: 'center', paddingVertical: spacing.xl, fontSize: type.bodySize },
  addButton: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: radius.action,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  addText: { fontSize: type.bodySize, fontWeight: '700' },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderRadius: radius.action,
    paddingHorizontal: spacing.lg,
    fontSize: type.bodySize,
  },
  label: {
    fontSize: type.metaSize,
    fontWeight: '700',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
  },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: radius.action,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
  action: { flex: 1, minHeight: 46, borderRadius: radius.action, alignItems: 'center', justifyContent: 'center' },
  actionText: { fontSize: type.bodySize, fontWeight: '700' },
  primaryText: { color: '#FFF', fontSize: type.bodySize, fontWeight: '700' },
  disabled: { opacity: 0.45 },
});
