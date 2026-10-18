import React, { useEffect, useState } from 'react';
import { Q, type Database } from '@nozbe/watermelondb';
import { Box, Pressable, Text } from '@gluestack-ui/themed';
import { ChevronLeft, ChevronRight, Minus, Plus } from 'react-native-feather';
import { createTransaction } from '../../db/operations';
import type Account from '../../db/models/Account';
import type Category from '../../db/models/Category';
import { useQuickAdd } from '../../state/useQuickAdd';
import { useSettings } from '../../state/useSettings';
import { useMoney } from '../../state/useMoney';
import { useTranslation, type TranslationKey } from '../../i18n';
import { usePalette, useThemedStyles } from '../../theme';
import { playSound } from '../../services/sound';
import { useToast } from '../Toast';
import SheetScaffold from './SheetScaffold';
import { makeStyles } from './QuickAddSheet.styles';

const STEP = 100;

/** DETALLES: alta rápida (cantidad +/−, categoría ◄►, comentario ◄►). */
export default function QuickAddSheet({ db }: { db: Database }) {
  const styles = useThemedStyles(makeStyles);
  const palette = usePalette();
  const money = useMoney();
  const { t } = useTranslation();
  const { showError } = useToast();
  const open = useQuickAdd(s => s.open);
  const kind = useQuickAdd(s => s.kind);
  const close = useQuickAdd(s => s.close);
  const notes = useSettings(s => s.noteHistory);

  const [amountCents, setAmountCents] = useState(0);
  const [cats, setCats] = useState<Category[]>([]);
  const [catIndex, setCatIndex] = useState(0);
  const [noteIndex, setNoteIndex] = useState(0);

  useEffect(() => {
    if (!open) {
      return;
    }
    setAmountCents(0);
    setCatIndex(0);
    setNoteIndex(0);
    db.get<Category>('categories')
      .query(Q.where('kind', kind), Q.sortBy('sort_order', Q.asc))
      .fetch()
      .then(list => setCats(list.filter(c => c.id !== 'cat_other_inc')))
      .catch(error => showError(error, 'errors.categoriesLoad'));
  }, [open, kind, db, showError]);

  const catLabel = (cat?: Category) => {
    if (!cat) {
      return t('entry.chooseCategoryPlaceholder');
    }
    const key = `category.${cat.id}` as TranslationKey;
    const translated = t(key);
    return translated === key ? cat.name : translated;
  };

  const accent = kind === 'income' ? palette.income : palette.expense;
  const canConfirm = amountCents > 0 && cats.length > 0;
  const cycle = (index: number, delta: number, length: number) =>
    length > 0 ? (index + delta + length) % length : 0;

  const confirm = async () => {
    const cat = cats[catIndex];
    if (!cat || amountCents <= 0) {
      playSound('error');
      return;
    }
    try {
      const accounts = await db.get<Account>('accounts').query().fetch();
      const account = accounts[0];
      if (!account) {
        return;
      }
      await createTransaction(db, {
        accountId: account.id,
        categoryId: cat.id,
        kind,
        amountCents,
        note: notes[noteIndex] ?? '',
        occurredOn: Date.now(),
      });
      playSound(kind);
      close();
    } catch (error) {
      playSound('error');
      showError(error, 'errors.entrySave');
    }
  };

  return (
    <SheetScaffold
      isOpen={open}
      onClose={close}
      title={kind === 'income' ? t('quickadd.incomeTitle') : t('quickadd.expenseTitle')}
      accent={accent}
      accentSoft={kind === 'income' ? palette.incomeSoft : palette.expenseSoft}
      presentation="page">
      <Box style={styles.body}>
        <Text style={styles.sectionLabel}>{t('quickadd.amountLabel')}</Text>
        <Box style={styles.amountCard}>
          <Text style={styles.amount}>{money(amountCents)}</Text>
          <Box style={styles.stepperRow}>
            <Pressable
              testID="quickadd-minus"
              style={styles.stepper}
              onPress={() => setAmountCents(v => Math.max(0, v - STEP))}>
              <Minus width={22} height={22} color={palette.primary} strokeWidth={3} />
            </Pressable>
            <Pressable
              testID="quickadd-plus"
              style={styles.stepper}
              onPress={() => setAmountCents(v => v + STEP)}>
              <Plus width={22} height={22} color={palette.primary} strokeWidth={3} />
            </Pressable>
          </Box>
        </Box>

        <Text style={styles.sectionLabel}>{t('quickadd.categoryLabel')}</Text>
        <Box style={styles.navRow}>
          <Pressable
            testID="quickadd-cat-prev"
            style={styles.navButton}
            onPress={() => setCatIndex(i => cycle(i, -1, cats.length))}>
            <ChevronLeft width={22} height={22} color={accent} strokeWidth={2.5} />
          </Pressable>
          <Text style={styles.navValue} numberOfLines={1}>{catLabel(cats[catIndex])}</Text>
          <Pressable
            testID="quickadd-cat-next"
            style={styles.navButton}
            onPress={() => setCatIndex(i => cycle(i, 1, cats.length))}>
            <ChevronRight width={22} height={22} color={accent} strokeWidth={2.5} />
          </Pressable>
        </Box>

        <Text style={styles.sectionLabel}>{t('quickadd.commentLabel')}</Text>
        <Box style={styles.navRow}>
          <Pressable
            testID="quickadd-note-prev"
            style={styles.navButton}
            onPress={() => setNoteIndex(i => cycle(i, -1, notes.length))}>
            <ChevronLeft width={22} height={22} color={palette.muted} strokeWidth={2.5} />
          </Pressable>
          <Text style={styles.navValue} numberOfLines={1}>
            {notes.length > 0 ? notes[noteIndex] : '—'}
          </Text>
          <Pressable
            testID="quickadd-note-next"
            style={styles.navButton}
            onPress={() => setNoteIndex(i => cycle(i, 1, notes.length))}>
            <ChevronRight width={22} height={22} color={palette.muted} strokeWidth={2.5} />
          </Pressable>
        </Box>

        <Pressable
          testID="quickadd-confirm"
          style={[styles.confirmButton, { backgroundColor: accent }, !canConfirm && styles.disabled]}
          disabled={!canConfirm}
          onPress={confirm}>
          <Text style={styles.confirmText}>{t('quickadd.confirm')}</Text>
        </Pressable>
      </Box>
    </SheetScaffold>
  );
}
