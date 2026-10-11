import React, { useEffect, useState } from 'react';
import { Alert, Keyboard, Platform, TextInput, Vibration, type StyleProp, type ViewStyle } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid, type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { Calendar, ChevronDown, ChevronRight, CreditCard, Repeat } from 'react-native-feather';
import { Box, Pressable, Text } from '@gluestack-ui/themed';
import type { Database } from '@nozbe/watermelondb';
import { Q } from '@nozbe/watermelondb';
import { createTransaction, deleteTransaction, updateTransaction, type EntryKind } from '../../db/operations';
import { createCategory } from '../../db/categories';
import { toCents } from '../../utils/currency';
import { useTranslation, type TranslationKey } from '../../i18n';
import { useEntry } from '../../state/useEntry';
import { useSettings } from '../../state/useSettings';
import { playSound } from '../../services/sound';
import { usePalette, useThemedStyles } from '../../theme';
import { useToast } from '../Toast';
import { CategoryIcon, type FeatherName } from '../icons';
import CategoryPickerModal from './CategoryPickerModal';
import SheetScaffold from './SheetScaffold';
import { makeStyles } from './EntrySheet.styles';
import type Account from '../../db/models/Account';
import type Category from '../../db/models/Category';

interface EntrySheetProps {
  db: Database;
  presentation?: 'sheet' | 'page';
  onOpenRecurring?: (payload: { kind: EntryKind; categoryId?: string; amountText?: string }) => void;
}
/**
 * Flujo en dos pasos: monto + categoría, después confirmación explícita.
 */
export default function EntrySheet({ db, presentation = 'sheet', onOpenRecurring }: EntrySheetProps) {
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
    editingOccurredOn,
    closeSheet,
    setBuffer,
    setNote,
    switchKind,
  } = useEntry();
  const { showError, showToast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [accountName, setAccountName] = useState('');
  const [occurredOn, setOccurredOn] = useState(() => Date.now());
  const [iosDatePickerOpen, setIosDatePickerOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedCategoryId(editingId ? editingCategoryId : null);
      setOccurredOn(editingId && editingOccurredOn ? editingOccurredOn : Date.now());
      setIosDatePickerOpen(false);
    }
  }, [editingCategoryId, editingId, editingOccurredOn, kind, open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    let cancelled = false;
    Promise.all([
      db.get<Category>('categories').query(Q.where('kind', kind), Q.sortBy('sort_order', Q.asc)).fetch(),
      db.get<Account>('accounts').query().fetch(),
    ])
      .then(([cats, accounts]) => {
        if (!cancelled) {
          setCategories(cats.filter(c => c.id !== 'cat_other_inc'));
          setAccountName(accounts[0]?.name ?? '');
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
        await updateTransaction(db, editingId, { amountCents, categoryId, note, occurredOn });
      } else {
        const accounts = await db.get<Account>('accounts').query().fetch();
        const account = accounts[0];
        if (!account) {
          showToast(t('errors.noAccount'));
          return;
        }
        await createTransaction(db, { accountId: account.id, categoryId, kind, amountCents, note, occurredOn });
      }
      playSound(editingId ? 'confirm' : kind);
      Vibration.vibrate([0, 25, 50, 25]);
      closeSheet({ preserveDraft: false });
    } catch (error) {
      playSound('error');
      showError(error, 'errors.entrySave');
    }
  };

  const onDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (selectedDate) {
      const current = new Date(occurredOn);
      selectedDate.setHours(current.getHours(), current.getMinutes(), 0, 0);
      setOccurredOn(selectedDate.getTime());
    }
    setIosDatePickerOpen(false);
  };

  const openDatePicker = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: new Date(occurredOn),
        mode: 'date',
        onChange: onDateChange,
      });
    } else {
      setIosDatePickerOpen(true);
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
  const date = new Date(occurredOn);
  const today = new Date();
  const dateLabel = date.toDateString() === today.toDateString()
    ? t('entry.today')
    : date.toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });

  return (
    <>
      <SheetScaffold
        isOpen={open}
        onClose={closeSheet}
        title={title}
        accent={accent}
        accentSoft={accentSoft}
        closeTestID="entry-close"
        presentation={presentation}
        pageHeaderMode="close"
        showSheetTitle={false}>
        {!editingId ? (
          <AnimatedBlock delay={0} style={styles.kindSegment}>
            {(['expense', 'income'] as const).map(option => {
              const selected = kind === option;
              return (
                <Pressable
                  key={option}
                  testID={`entry-kind-${option}`}
                    style={[
                      styles.kindOption,
                      selected && (option === 'expense' ? styles.kindOptionExpense : styles.kindOptionIncome),
                    ]}
                  onPress={() => switchKind(option)}>
                    <Text style={[styles.kindOptionText, selected && styles.kindOptionSelectedText]}>
                    {t(option === 'expense' ? 'entry.expense' : 'entry.income')}
                  </Text>
                </Pressable>
              );
            })}
          </AnimatedBlock>
        ) : null}
        <AnimatedBlock key={kind} delay={55} style={styles.amountPanel}>
          <Text style={styles.amountLabel}>{`${t('entry.amount')} · ${currency}`}</Text>
          <TextInput
            testID="entry-amount"
            style={styles.amountInput}
            value={buffer}
            onChangeText={setBuffer}
            keyboardType="decimal-pad"
            autoFocus={open && !pickerOpen}
            selectTextOnFocus={false}
            textAlign="center"
          />
        </AnimatedBlock>
        <AnimatedBlock delay={105}>
          <Pressable
            testID="category-select"
            accessibilityRole="button"
            accessibilityLabel={selectedLabel}
            style={styles.categorySelect}
            onPress={() => {
              Keyboard.dismiss();
              setPickerOpen(true);
            }}>
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
            <ChevronDown width={24} height={24} color={accent} strokeWidth={2.5} />
          </Pressable>
        </AnimatedBlock>
        <AnimatedBlock delay={155} style={styles.dateRow}>
          <Pressable
            testID="entry-date"
            accessibilityRole="button"
            style={styles.dateControl}
            onPress={openDatePicker}>
            <Calendar width={22} height={22} color={palette.primary} strokeWidth={2} />
            <Box>
              <Text style={styles.dateLabel}>{t('entry.date')}</Text>
              <Text style={styles.dateValue}>{dateLabel}</Text>
            </Box>
          </Pressable>
          <Box style={styles.dateControl}>
            <CreditCard width={22} height={22} color={palette.primary} strokeWidth={2} />
            <Box>
              <Text style={styles.dateLabel}>{t('entry.account')}</Text>
              <Text style={styles.dateValue}>{accountName || currency}</Text>
            </Box>
          </Box>
        </AnimatedBlock>
        <AnimatedBlock delay={205}>
          <TextInput
            testID="entry-note"
            style={styles.noteInput}
            value={note}
            onChangeText={setNote}
            placeholder={t('entry.note')}
            placeholderTextColor={palette.muted}
            maxLength={280}
          />
        </AnimatedBlock>
        <AnimatedBlock delay={255}>
          <Pressable
            testID="entry-repeat"
            accessibilityRole="button"
            accessibilityLabel={t('entry.repeat')}
            style={styles.repeatRow}
            onPress={() =>
              onOpenRecurring?.({
                kind,
                categoryId: selectedCategoryId ?? undefined,
                amountText: buffer,
              })
            }>
            <Repeat width={22} height={22} color={palette.muted} strokeWidth={2} />
            <Box style={styles.repeatCopy}>
              <Text style={styles.repeatLabel}>{t('entry.repeat')}</Text>
              <Text style={styles.repeatValue}>{t('entry.noRepeat')}</Text>
            </Box>
            <ChevronRight width={24} height={24} color={palette.muted} strokeWidth={2.5} />
          </Pressable>
        </AnimatedBlock>
        <AnimatedBlock delay={305}>
          <Pressable
            testID="entry-submit"
            accessibilityRole="button"
            accessibilityState={{ disabled: !selectedCategoryId }}
            disabled={!selectedCategoryId}
            style={[
              styles.submitButton,
              !selectedCategoryId && styles.submitButtonDisabled,
            ]}
            onPress={() => selectedCategoryId && commit(selectedCategoryId)}>
            <Text style={styles.submitText}>{t('entry.save')}</Text>
          </Pressable>
        </AnimatedBlock>
        {editingId ? (
          <AnimatedBlock delay={355}>
            <Pressable
              testID="entry-delete"
              style={styles.deleteButton}
              accessibilityRole="button"
              accessibilityLabel={t('entry.delete')}
              onPress={confirmDelete}>
              <Text style={styles.deleteText}>{t('entry.delete')}</Text>
            </Pressable>
          </AnimatedBlock>
        ) : null}
      </SheetScaffold>
      {Platform.OS !== 'android' && iosDatePickerOpen ? (
        <DateTimePicker value={date} mode="date" onChange={onDateChange} />
      ) : null}
      <CategoryPickerModal
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        categories={categories}
        selectedId={selectedCategoryId}
        kind={kind}
        onSelect={setSelectedCategoryId}
        onCreate={createCustomCategory}
        presentation="sheet"
      />
    </>
  );
}

function AnimatedBlock({
  children,
  delay = 0,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const progress = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 12 }],
  }));

  useEffect(() => {
    progress.value = withDelay(delay, withTiming(1, { duration: 220 }));
  }, [delay, progress]);

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}
