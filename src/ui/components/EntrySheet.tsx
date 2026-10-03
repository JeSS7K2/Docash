import React, { useEffect, useState } from 'react';
import { Alert, TextInput, Vibration } from 'react-native';
import { Box, Pressable, Text } from '@gluestack-ui/themed';
import type { Database } from '@nozbe/watermelondb';
import { Q } from '@nozbe/watermelondb';
import { createTransaction, deleteTransaction, updateTransaction } from '../../db/operations';
import { createCategory } from '../../db/categories';
import { createRecurringRule } from '../../db/recurring';
import { recurringReminderAt, scheduleRecurringReminder } from '../../notifications/reminders';
import { toCents, formatCents } from '../../utils/currency';
import { intlLocale, translate, useTranslation, type TranslationKey } from '../../i18n';
import { useEntry } from '../../state/useEntry';
import { useSettings } from '../../state/useSettings';
import { playSound } from '../../services/sound';
import { usePalette, useThemedStyles } from '../../theme';
import { useToast } from '../Toast';
import { CategoryIcon, type FeatherName } from '../icons';
import CategoryPickerModal from './CategoryPickerModal';
import Numpad from './Numpad';
import SheetScaffold from './SheetScaffold';
import Toggle from './Toggle';
import { makeStyles } from './EntrySheet.styles';
import type Account from '../../db/models/Account';
import type Category from '../../db/models/Category';

interface EntrySheetProps {
  db: Database;
  presentation?: 'sheet' | 'page';
}

/**
 * Flujo en dos pasos: monto + categoría, después confirmación explícita.
 */
export default function EntrySheet({ db, presentation = 'sheet' }: EntrySheetProps) {
  const styles = useThemedStyles(makeStyles);
  const palette = usePalette();
  const { t, locale } = useTranslation();
  const currency = useSettings(s => s.currency);
  const {
    open,
    kind,
    buffer,
    note,
    editingId,
    editingCategoryId,
    closeSheet,
    pressKey,
    setNote,
    switchKind,
  } = useEntry();
  const { showError, showToast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [repeat, setRepeat] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setRepeat(false);
      setSelectedCategoryId(editingId ? editingCategoryId : null);
    }
  }, [editingCategoryId, editingId, kind, open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    let cancelled = false;
    db.get<Category>('categories')
      .query(Q.where('kind', kind), Q.sortBy('sort_order', Q.asc))
      .fetch()
      .then(cats => {
        if (!cancelled) {
          setCategories(cats.filter(c => c.id !== 'cat_other_inc'));
        }
      })
      .catch(error => showError(error, 'errors.categoriesLoad'));
    return () => {
      cancelled = true;
    };
  }, [db, kind, open, showError]);

  const commit = async (categoryId: string) => {
    try {
      const amountCents = toCents(buffer);
      if (editingId) {
        await updateTransaction(db, editingId, { amountCents, categoryId, note });
      } else {
        const accounts = await db.get<Account>('accounts').query().fetch();
        const account = accounts[0];
        if (!account) {
          showToast(t('errors.noAccount'));
          return;
        }
        await createTransaction(db, { accountId: account.id, categoryId, kind, amountCents, note });
        if (repeat) {
          const rule = await createRecurringRule(db, {
            accountId: account.id,
            categoryId,
            kind,
            amountCents,
            frequency: 'monthly',
          });
          const { reminderHour, locale: loc } = useSettings.getState();
          const at = recurringReminderAt(rule.nextRun, reminderHour);
          if (at > Date.now()) {
            const key = `category.${categoryId}` as TranslationKey;
            const translated = translate(loc, key);
            const name =
              translated === key
                ? categories.find(c => c.id === categoryId)?.name ?? categoryId
                : translated;
            await scheduleRecurringReminder(
              rule.id,
              at,
              'Docash',
              translate(loc, 'reminders.recurringBody', { name }),
            );
          }
        }
      }
      playSound(editingId ? 'confirm' : kind);
      Vibration.vibrate([0, 25, 50, 25]);
      closeSheet({ preserveDraft: false });
    } catch (error) {
      playSound('error');
      showError(error, 'errors.entrySave');
    }
  };

  const confirmDelete = () => {
    if (!editingId) {
      return;
    }
    Alert.alert(t('entry.delete'), t('tx.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('entry.delete'),
        style: 'destructive',
        onPress: () => {
          playSound('delete');
          deleteTransaction(db, editingId)
            .then(() => closeSheet({ preserveDraft: false }))
            .catch(error => showError(error, 'errors.entryDelete'));
        },
      },
    ]);
  };

  const createCustomCategory = async (name: string, icon: FeatherName): Promise<boolean> => {
    try {
      const category = await createCategory(db, { name, icon, kind });
      setCategories(current =>
        [...current, category].sort((a, b) => a.sortOrder - b.sortOrder),
      );
      setSelectedCategoryId(category.id);
      showToast(t('entry.categoryCreated'), 'success');
      return true;
    } catch (error) {
      showError(error, 'errors.categoryCreate');
      return false;
    }
  };

  const accent = kind === 'income' ? palette.income : palette.expense;
  const accentSoft = kind === 'income' ? palette.incomeSoft : palette.expenseSoft;
  const title = editingId
    ? t('tx.edit')
    : kind === 'expense'
      ? t('entry.newExpense')
      : t('entry.newIncome');
  const selectedCategory = categories.find(category => category.id === selectedCategoryId);
  const selectedLabel = selectedCategory
    ? (() => {
        const key = `category.${selectedCategory.id}` as TranslationKey;
        const translated = t(key);
        return translated === key ? selectedCategory.name : translated;
      })()
    : t('entry.chooseCategoryPlaceholder');

  return (
    <>
      <SheetScaffold
        isOpen={open && !pickerOpen}
        onClose={closeSheet}
        title={title}
        accent={accent}
        accentSoft={accentSoft}
        closeTestID="entry-close"
        presentation={presentation}>
        {!editingId ? (
          <Box style={styles.kindSegment}>
            {(['expense', 'income'] as const).map(option => {
              const selected = kind === option;
              const buttonColor = selected ? (option === 'expense' ? palette.primary : palette.income) : 'transparent';
              const textColor = selected && option === 'expense' ? '#FFFFFF' : palette.ink;
              return (
                <Pressable
                  key={option}
                  testID={`entry-kind-${option}`}
                  style={[styles.kindOption, { backgroundColor: buttonColor }]}
                  onPress={() => switchKind(option)}>
                  <Text style={[styles.kindOptionText, { color: textColor }]}>
                    {t(option === 'expense' ? 'entry.expense' : 'entry.income')}
                  </Text>
                </Pressable>
              );
            })}
          </Box>
        ) : null}
        <Box style={[styles.amountPanel, { backgroundColor: accent }]}>
          <Text style={styles.amountLabel}>{`${t('entry.amount').toLocaleUpperCase()} · ${currency}`}</Text>
          <Text style={styles.amount} testID="entry-amount">{formatBuffer(buffer, currency, locale)}</Text>
        </Box>
        <Text style={styles.fieldLabel}>
          {kind === 'income' ? t('entry.selectIncomeCategory') : t('entry.selectCategory')}
        </Text>
        <Pressable
          testID="category-select"
          accessibilityRole="button"
          accessibilityLabel={selectedLabel}
          style={styles.categorySelect}
          onPress={() => setPickerOpen(true)}>
          {selectedCategory ? (
            <CategoryIcon
              id={selectedCategory.id}
              icon={selectedCategory.icon}
              color={accent}
              size={22}
            />
          ) : null}
          <Text style={[styles.categorySelectText, !selectedCategory && styles.placeholder]}>
            {selectedLabel}
          </Text>
          <Text style={[styles.chevron, { color: accent }]}>⌄</Text>
        </Pressable>
        <Box style={styles.dateRow}>
          <Box style={styles.dateControl}>
            <Text style={styles.fieldLabel}>{t('entry.date')}</Text>
            <Text style={styles.dateValue}>{t('entry.today')}</Text>
          </Box>
          <Box style={styles.repeatControl}>
            <Text style={styles.repeatLabel}>{t('entry.repeat')}</Text>
            <Toggle value={repeat} onValueChange={setRepeat} />
          </Box>
        </Box>
        <TextInput
          testID="entry-note"
          style={styles.noteInput}
          value={note}
          onChangeText={setNote}
          placeholder={t('entry.note')}
          placeholderTextColor={palette.muted}
          maxLength={280}
        />
        <Numpad onKey={pressKey} />
        <Text style={styles.stepHint}>{t('entry.chooseCategory')}</Text>
        <Pressable
          testID="entry-submit"
          accessibilityRole="button"
          accessibilityState={{ disabled: !selectedCategoryId }}
          disabled={!selectedCategoryId}
          style={[
            styles.submitButton,
            { backgroundColor: kind === 'income' ? palette.income : palette.primary },
            !selectedCategoryId && styles.submitButtonDisabled,
          ]}
          onPress={() => selectedCategoryId && commit(selectedCategoryId)}>
          <Text style={[styles.submitText, kind === 'income' && styles.incomeSubmitText]}>{t('entry.submit')}</Text>
        </Pressable>
        {editingId ? (
          <Pressable
            testID="entry-delete"
            style={styles.deleteButton}
            accessibilityRole="button"
            accessibilityLabel={t('entry.delete')}
            onPress={confirmDelete}>
            <Text style={styles.deleteText}>{t('entry.delete')}</Text>
          </Pressable>
        ) : null}
      </SheetScaffold>
      <CategoryPickerModal
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        categories={categories}
        selectedId={selectedCategoryId}
        kind={kind}
        onSelect={setSelectedCategoryId}
        onCreate={createCustomCategory}
        presentation={presentation}
      />
    </>
  );
}

function formatBuffer(buffer: string, currency: string, locale: 'en' | 'es'): string {
  try {
    return formatCents(toCents(buffer), currency, intlLocale(locale));
  } catch {
    return formatCents(0, currency, intlLocale(locale));
  }
}
