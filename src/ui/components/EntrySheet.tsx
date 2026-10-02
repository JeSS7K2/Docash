import React, { useEffect, useState } from 'react';
import { Alert, Switch, TextInput, Vibration } from 'react-native';
import { Divider, Pressable, Text } from '@gluestack-ui/themed';
import type { Database } from '@nozbe/watermelondb';
import { Q } from '@nozbe/watermelondb';
import { createTransaction, deleteTransaction, updateTransaction } from '../../db/operations';
import { createRecurringRule } from '../../db/recurring';
import { recurringReminderAt, scheduleRecurringReminder } from '../../notifications/reminders';
import { toCents, formatCents } from '../../utils/currency';
import { intlLocale, translate, useTranslation, type TranslationKey } from '../../i18n';
import { useEntry } from '../../state/useEntry';
import { useSettings } from '../../state/useSettings';
import { playSound } from '../../services/sound';
import { usePalette, useThemedStyles } from '../../theme';
import CategoryGrid from './CategoryGrid';
import Numpad from './Numpad';
import SheetScaffold from './SheetScaffold';
import { makeStyles } from './EntrySheet.styles';
import type Account from '../../db/models/Account';
import type Category from '../../db/models/Category';

interface EntrySheetProps {
  db: Database;
}

/**
 * Flujo de 3 segundos: monto + categoría = commit. Identidad por tipo
 * (gasto rojo / ingreso verde) vía SheetScaffold.
 */
export default function EntrySheet({ db }: EntrySheetProps) {
  const styles = useThemedStyles(makeStyles);
  const palette = usePalette();
  const { t, locale } = useTranslation();
  const currency = useSettings(s => s.currency);
  const { open, kind, buffer, note, editingId, closeSheet, pressKey, setNote } = useEntry();
  const [categories, setCategories] = useState<Category[]>([]);
  const [repeat, setRepeat] = useState(false);

  useEffect(() => {
    if (open) {
      setRepeat(false);
    }
  }, [open]);

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
      .catch(error => console.error('[entry] categories failed', error));
    return () => {
      cancelled = true;
    };
  }, [db, open, kind]);

  const commit = async (categoryId: string) => {
    try {
      const amountCents = toCents(buffer);
      if (editingId) {
        await updateTransaction(db, editingId, { amountCents, categoryId, note });
      } else {
        const accounts = await db.get<Account>('accounts').query().fetch();
        const account = accounts[0];
        if (!account) {
          return;
        }
        await createTransaction(db, { accountId: account.id, categoryId, kind, amountCents, note });
        if (kind === 'income' && repeat) {
          const rule = await createRecurringRule(db, {
            accountId: account.id,
            categoryId,
            kind: 'income',
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
      closeSheet();
    } catch (error) {
      playSound('error');
      console.error('[entry] commit failed', error);
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
            .then(closeSheet)
            .catch(error => console.error('[entry] delete failed', error));
        },
      },
    ]);
  };

  const accent = kind === 'income' ? palette.income : palette.expense;
  const accentSoft = kind === 'income' ? palette.incomeSoft : palette.expenseSoft;
  const title = editingId
    ? t('tx.edit')
    : kind === 'expense'
      ? t('entry.expense')
      : t('entry.income');

  return (
    <SheetScaffold
      isOpen={open}
      onClose={closeSheet}
      title={title}
      accent={accent}
      accentSoft={accentSoft}
      closeTestID="entry-close">
      <Text style={[styles.amount, { color: accent }]} testID="entry-amount">
        {formatBuffer(buffer, currency, locale)}
      </Text>
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
      {kind === 'income' && !editingId ? (
        <Pressable style={styles.repeatRow}>
          <Text style={styles.repeatLabel}>{t('entry.repeat')}</Text>
          <Switch value={repeat} onValueChange={setRepeat} />
        </Pressable>
      ) : null}
      <Divider style={styles.divider} />
      <CategoryGrid categories={categories} onSelect={commit} />
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
  );
}

function formatBuffer(buffer: string, currency: string, locale: 'en' | 'es'): string {
  try {
    return formatCents(toCents(buffer), currency, intlLocale(locale));
  } catch {
    return formatCents(0, currency, intlLocale(locale));
  }
}
