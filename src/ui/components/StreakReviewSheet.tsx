import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ArrowDown, ArrowUp, Check, Plus } from 'react-native-feather';
import type { Database } from '@nozbe/watermelondb';
import type Transaction from '../../db/models/Transaction';
import type Category from '../../db/models/Category';
import { getStreakState, getTodayTransactions, confirmToday, StreakError, type StreakState } from '../../db/streaks';
import { useMoney } from '../../state/useMoney';
import { useSettings } from '../../state/useSettings';
import { useTranslation, type TranslationKey } from '../../i18n';
import { usePalette, useThemedStyles } from '../../theme';
import { reconcileStreakReminder } from '../../notifications/streakReminders';
import { useToast } from '../Toast';
import SheetScaffold from './SheetScaffold';
import { makeStyles } from './StreakReviewSheet.styles';

interface StreakReviewSheetProps {
  db: Database;
  isOpen: boolean;
  onClose: () => void;
  onAddMovement: () => void;
  onEditMovement: (id: string) => void;
  onChanged: () => void;
  presentation?: 'sheet' | 'page';
}

export default function StreakReviewSheet({
  db,
  isOpen,
  onClose,
  onAddMovement,
  onEditMovement,
  onChanged,
  presentation = 'sheet',
}: StreakReviewSheetProps) {
  const styles = useThemedStyles(makeStyles);
  const palette = usePalette();
  const money = useMoney();
  const { t } = useTranslation();
  const locale = useSettings(s => s.locale);
  const { showError, showToast } = useToast();
  const [state, setState] = useState<StreakState | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const nextState = await getStreakState(db);
      const today = await getTodayTransactions(db, nextState.settings.reviewTimeZone, Date.now());
      const nextCategories = await db.get<Category>('categories').query().fetch();
      setState(nextState);
      setTransactions(today);
      setCategories(nextCategories);
    } catch (error) {
      showError(error, 'errors.streakLoad');
    }
  };

  useEffect(() => {
    if (isOpen) {
      load().catch(error => showError(error, 'errors.streakLoad'));
    }
    // The sheet is deliberately refreshed only when opened; transaction entry refreshes it on return.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, db]);

  const confirm = async () => {
    if (saving || !state) { return; }
    setSaving(true);
    try {
      const method = transactions.length ? 'reviewed' : 'no_movements';
      const result = await confirmToday(db, method, undefined);
      showToast(t('streak.success', { count: result.summary.currentStreak }), 'success');
      await reconcileStreakReminder(db, locale);
      await load();
      onChanged();
    } catch (error) {
      if (error instanceof StreakError && error.code === 'movements_exist') {
        showToast(t('errors.streakMovements'));
        await load();
      } else if (error instanceof StreakError && error.code === 'clock_rewound') {
        showToast(t('streak.clockWarning'));
      } else {
        showError(error, 'errors.streakSave');
      }
    } finally {
      setSaving(false);
    }
  };

  const categoryName = (id?: string) => {
    const category = categories.find(item => item.id === id);
    if (!category) { return t('entry.selectCategory'); }
    const key = `category.${category.id}` as TranslationKey;
    const translated = t(key);
    return translated === key ? category.name : translated;
  };
  const income = transactions.filter(item => item.kind === 'income').reduce((sum, item) => sum + item.amountCents, 0);
  const expenses = transactions.filter(item => item.kind === 'expense').reduce((sum, item) => sum + item.amountCents, 0);
  const confirmed = state?.summary.todayConfirmed;
  const todayReview = state?.reviews.find(review => review.localDate === state.currentDate);
  const newSinceReview = Boolean(confirmed && todayReview && transactions.some(item => item.updatedAt > todayReview.confirmedAtUtc));

  return (
    <SheetScaffold
      isOpen={isOpen}
      onClose={onClose}
      title={t('streak.reviewToday')}
      accent={palette.primary}
      accentSoft={palette.primarySoft}
      presentation={presentation}
      pageHeaderMode="close"
      showSheetTitle={presentation === 'page'}>
      <View style={styles.body}>
        {state?.clockRewound ? <Text style={styles.warning}>{t('streak.clockWarning')}</Text> : null}
        <Text style={styles.date}>{state?.currentDate ?? t('streak.today')}</Text>
        {transactions.length ? (
          <>
            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <ArrowDown width={20} height={20} color={palette.income} />
                <Text style={styles.summaryText}>{`${t('streak.income')}: ${money(income)}`}</Text>
              </View>
              <View style={styles.summaryCard}>
                <ArrowUp width={20} height={20} color={palette.expense} />
                <Text style={styles.summaryText}>{`${t('streak.expenses')}: ${money(expenses)}`}</Text>
              </View>
            </View>
            {transactions.map(transaction => (
              <Pressable key={transaction.id} accessibilityRole="button" style={styles.transactionRow} onPress={() => onEditMovement(transaction.id)}>
                {transaction.kind === 'income' ? <ArrowDown width={20} height={20} color={palette.income} /> : <ArrowUp width={20} height={20} color={palette.expense} />}
                <View style={styles.transactionCopy}>
                  <Text style={styles.transactionTitle}>{categoryName(transaction.categoryId)}</Text>
                  <Text style={styles.transactionMeta}>{transaction.note || t('streak.today')}</Text>
                </View>
                <Text style={[styles.transactionAmount, { color: transaction.kind === 'income' ? palette.income : palette.expense }]}>
                  {`${transaction.kind === 'income' ? '+' : '−'}${money(transaction.amountCents)}`}
                </Text>
              </Pressable>
            ))}
          </>
        ) : (
          <View style={styles.emptyCard}>
            <Check width={28} height={28} color={palette.primary} />
            <Text style={styles.emptyTitle}>{t('streak.noMovementsHint')}</Text>
          </View>
        )}

        {confirmed ? (
          <>
            <View style={styles.confirmedCard}>
              <Check width={22} height={22} color={palette.income} />
              <Text style={styles.confirmedText}>{t('streak.todayDone')}</Text>
            </View>
            {newSinceReview ? <Text style={styles.newSinceReview}>{t('streak.newSinceReview')}</Text> : null}
          </>
        ) : (
          <Text style={styles.question}>{t('streak.reviewQuestion')}</Text>
        )}
        <Pressable accessibilityRole="button" style={styles.addMovement} onPress={onAddMovement}>
          <Plus width={20} height={20} color={palette.primary} />
          <Text style={styles.addMovementText}>{t('streak.addMovement')}</Text>
        </Pressable>
        {confirmed ? null : (
          <Pressable accessibilityRole="button" disabled={saving} style={[styles.confirmButton, saving && styles.disabled]} onPress={confirm}>
            <Text style={styles.confirmButtonText}>{transactions.length ? t('streak.reviewed') : t('streak.noMovements')}</Text>
          </Pressable>
        )}
      </View>
    </SheetScaffold>
  );
}
