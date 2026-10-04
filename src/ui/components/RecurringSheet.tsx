import React, { useEffect, useState } from 'react';
import { TextInput } from 'react-native';
import { Box, Pressable, Text } from '@gluestack-ui/themed';
import { Trash2 } from 'react-native-feather';
import type { Database } from '@nozbe/watermelondb';
import { Q } from '@nozbe/watermelondb';
import type Category from '../../db/models/Category';
import type Account from '../../db/models/Account';
import type RecurringRule from '../../db/models/RecurringRule';
import { createRecurringRule, deleteRecurringRule, defaultScheduleDay } from '../../db/recurring';
import type { Frequency, IntervalUnit } from '../../db/models/RecurringRule';
import type { EntryKind } from '../../db/operations';
import { toCents } from '../../utils/currency';
import { displayToBaseCents } from '../../utils/fx';
import {
  cancelRecurringReminder,
  recurringReminderAt,
  scheduleRecurringReminder,
} from '../../notifications/reminders';
import { useMoney } from '../../state/useMoney';
import { useSettings } from '../../state/useSettings';
import { translate, useTranslation, type TranslationKey } from '../../i18n';
import { usePalette, useThemedStyles } from '../../theme';
import { CategoryIcon } from '../icons';
import SheetScaffold from './SheetScaffold';
import { makeSheetUi } from './sheetUi.styles';
import { makeStyles } from './RecurringSheet.styles';
import { useToast } from '../Toast';

interface RecurringSheetProps {
  isOpen: boolean;
  onClose: () => void;
  db: Database;
  presentation?: 'sheet' | 'page';
  /** Abre directo el formulario, prellenado (p. ej. desde el registro de un movimiento). */
  initial?: { kind: EntryKind; categoryId?: string; amountText?: string };
}

type Phase = 'list' | 'kind' | 'form';

const FREQUENCIES: Frequency[] = ['daily', 'weekly', 'monthly', 'custom'];
const UNITS: IntervalUnit[] = ['day', 'week', 'month'];

export default function RecurringSheet({ isOpen, onClose, db, presentation = 'sheet', initial }: RecurringSheetProps) {
  const ui = useThemedStyles(makeSheetUi);
  const styles = useThemedStyles(makeStyles);
  const palette = usePalette();
  const money = useMoney();
  const { t, locale } = useTranslation();
  const { showError, showToast } = useToast();
  const currency = useSettings(s => s.currency);
  const rate = useSettings(s => s.exchangeRate);

  const [phase, setPhase] = useState<Phase>('list');
  const [rules, setRules] = useState<RecurringRule[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [account, setAccount] = useState<Account | null>(null);
  const [kind, setKind] = useState<EntryKind>('expense');
  const [categoryId, setCategoryId] = useState<string>('');
  const [amountText, setAmountText] = useState('');
  const [frequency, setFrequency] = useState<Frequency>('monthly');
  const [scheduleDay, setScheduleDay] = useState<number>(() => defaultScheduleDay('monthly'));
  const [dayText, setDayText] = useState(String(defaultScheduleDay('monthly')));
  const [intervalCount, setIntervalCount] = useState(1);
  const [intervalUnit, setIntervalUnit] = useState<IntervalUnit>('day');

  const localeTag = locale === 'es' ? 'es-ES' : 'en-US';
  const weekdayOptions = Array.from({ length: 7 }, (_, i) => ({
    value: i + 1,
    label: new Date(2024, 0, 1 + i).toLocaleDateString(localeTag, { weekday: 'short' }),
  }));

  const reload = async () => {
    const [nextRules, categories, accounts] = await Promise.all([
      db.get<RecurringRule>('recurring_rules').query(Q.sortBy('created_at', Q.desc)).fetch(),
      db.get<Category>('categories').query(Q.sortBy('sort_order', Q.asc)).fetch(),
      db.get<Account>('accounts').query().fetch(),
    ]);
    setRules(nextRules);
    setCats(categories);
    setAccount(accounts[0] ?? null);
  };

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    if (initial) {
      setKind(initial.kind);
      setCategoryId(initial.categoryId ?? '');
      setAmountText(initial.amountText ?? '');
      setFrequency('monthly');
      setPhase('form');
    } else {
      setPhase('list');
    }
    reload().catch(error => showError(error, 'errors.recurringLoad'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, db, initial]);

  const kindCats = cats.filter(c => c.kind === kind && c.id !== 'cat_other_inc');

  const labelFor = (catId?: string) => {
    const cat = cats.find(c => c.id === catId);
    if (!cat) {
      return '—';
    }
    const key = `category.${cat.id}` as TranslationKey;
    const translated = t(key);
    return translated === key ? cat.name : translated;
  };

  const resetForm = () => {
    setCategoryId('');
    setAmountText('');
    setFrequency('monthly');
    setIntervalCount(1);
    setIntervalUnit('day');
  };

  const pickKind = (k: EntryKind) => {
    setKind(k);
    setCategoryId('');
    const defaultFreq: Frequency = k === 'income' ? 'daily' : 'monthly';
    setFrequency(defaultFreq);
    if (defaultFreq === 'monthly') {
      const d = defaultScheduleDay(defaultFreq);
      setScheduleDay(d);
      setDayText(String(d));
    }
    setPhase('form');
  };

  const add = async () => {
    if (!account || !categoryId || !amountText) {
      showToast(t('errors.recurringRequired'));
      return;
    }
    let amountCents = 0;
    try {
      amountCents = displayToBaseCents(toCents(amountText), currency, rate);
    } catch {
      showToast(t('errors.invalidAmount'));
      return;
    }
    try {
      const created = await createRecurringRule(db, {
        accountId: account.id,
        categoryId,
        kind,
        amountCents,
        frequency,
        scheduleDay: frequency === 'weekly' || frequency === 'monthly' ? scheduleDay : undefined,
        intervalCount: frequency === 'custom' ? intervalCount : undefined,
        intervalUnit: frequency === 'custom' ? intervalUnit : undefined,
      });
      const { reminderHour, locale: loc } = useSettings.getState();
      const notifyAt = recurringReminderAt(created.nextRun, reminderHour);
      if (notifyAt > Date.now()) {
        const key = `category.${categoryId}` as TranslationKey;
        const translated = translate(loc, key);
        const name = translated === key ? labelFor(categoryId) : translated;
        await scheduleRecurringReminder(
          created.id,
          notifyAt,
          'Docash',
          translate(loc, 'reminders.recurringBody', { name }),
        );
      }
      resetForm();
      if (initial) {
        onClose();
      } else {
        setPhase('list');
        await reload();
      }
    } catch (error) {
      showError(error, 'errors.recurringSave');
    }
  };

  const remove = (rule: RecurringRule) => {
    cancelRecurringReminder(rule.id);
    deleteRecurringRule(db, rule.id)
      .then(reload)
      .catch(error => showError(error, 'errors.recurringDelete'));
  };

  return (
    <SheetScaffold
      isOpen={isOpen}
      onClose={onClose}
      title={t('recurring.title')}
      accent={palette.recurring}
      accentSoft={palette.recurringSoft}
      presentation={presentation}>
      <Box style={ui.body}>
        {phase === 'list' ? (
          <>
            {rules.length === 0 ? (
              <Box style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>{t('recurring.emptyTitle')}</Text>
                <Text style={styles.emptyBody}>{t('recurring.emptyBody')}</Text>
              </Box>
            ) : null}
            {rules.map(rule => (
              <Box key={rule.id} style={[ui.row, styles.ruleCard]}>
                <CategoryIcon
                  id={rule.categoryId}
                  icon={cats.find(category => category.id === rule.categoryId)?.icon}
                  color={palette.ink}
                  size={20}
                />
                <Box style={ui.spacer}>
                  <Text style={ui.rowTitle}>{labelFor(rule.categoryId)}</Text>
                  <Text style={ui.rowMeta}>
                    {`${rule.kind === 'expense' ? '−' : '+'}${money(rule.amountCents)} · ${t(
                      `recurring.${rule.frequency}` as 'recurring.monthly',
                    )}`}
                  </Text>
                </Box>
                <Pressable
                  testID={`recurring-delete-${rule.id}`}
                  style={ui.iconButton}
                  onPress={() => remove(rule)}>
                  <Trash2 width={20} height={20} color={palette.expense} strokeWidth={2} />
                </Pressable>
              </Box>
            ))}
            <Pressable
              testID="recurring-add"
              style={[ui.actionButton, styles.addButton]}
              onPress={() => setPhase('kind')}>
              <Text style={[ui.actionButtonText, styles.addButtonText]}>{t('recurring.add')}</Text>
            </Pressable>
          </>
        ) : null}

        {phase === 'kind' ? (
          <>
            <Box style={styles.kindRow}>
              <Pressable
                testID="recurring-kind-expense"
                style={[styles.kindCard, styles.kindCardExpense]}
                onPress={() => pickKind('expense')}>
                <Text style={styles.kindCardText}>{t('entry.expense')}</Text>
              </Pressable>
              <Pressable
                testID="recurring-kind-income"
                style={[styles.kindCard, styles.kindCardIncome]}
                onPress={() => pickKind('income')}>
                <Text style={styles.kindCardText}>{t('entry.income')}</Text>
              </Pressable>
            </Box>
            <Pressable
              testID="recurring-back"
              style={[ui.actionButton, styles.addButton]}
              onPress={() => setPhase('list')}>
              <Text style={[ui.actionButtonText, styles.addButtonText]}>{t('common.back')}</Text>
            </Pressable>
          </>
        ) : null}

        {phase === 'form' ? (
          <>
            <Pressable
              testID="recurring-back"
              style={styles.backButton}
              onPress={() => (initial ? onClose() : setPhase('kind'))}>
              <Text style={styles.backText}>{`‹ ${t('common.back')}`}</Text>
            </Pressable>
            <Text style={ui.section}>{t('recurring.category')}</Text>
            <Box style={ui.chips}>
              {kindCats.map(cat => {
                const active = categoryId === cat.id;
                return (
                  <Pressable
                    key={cat.id}
                    testID={`recurring-cat-${cat.id}`}
                    style={[ui.chip, active && ui.chipActive]}
                    onPress={() => setCategoryId(cat.id)}>
                    <Text style={[ui.chipText, active && ui.chipTextActive]}>{labelFor(cat.id)}</Text>
                  </Pressable>
                );
              })}
            </Box>
            <Text style={ui.section}>{t('recurring.amount')}</Text>
            <TextInput
              testID="recurring-amount"
              style={ui.input}
              keyboardType="decimal-pad"
              value={amountText}
              onChangeText={setAmountText}
              placeholder="0"
              placeholderTextColor={palette.muted}
            />
            <Text style={ui.section}>{t('recurring.frequency')}</Text>
            <Box style={ui.chips}>
              {FREQUENCIES.map(f => (
                <Pressable
                  key={f}
                  testID={`recurring-freq-${f}`}
                  style={[ui.chip, frequency === f && ui.chipActive]}
                  onPress={() => {
                    setFrequency(f);
                    if (f === 'weekly' || f === 'monthly') {
                      const d = defaultScheduleDay(f);
                      setScheduleDay(d);
                      setDayText(String(d));
                    }
                  }}>
                  <Text style={[ui.chipText, frequency === f && ui.chipTextActive]}>
                    {t(`recurring.${f}` as 'recurring.monthly')}
                  </Text>
                </Pressable>
              ))}
            </Box>

            {frequency === 'weekly' ? (
              <>
                <Text style={ui.section}>{t('recurring.weekday')}</Text>
                <Box style={ui.chips}>
                  {weekdayOptions.map(w => (
                    <Pressable
                      key={w.value}
                      testID={`recurring-wd-${w.value}`}
                      style={[ui.chip, scheduleDay === w.value && ui.chipActive]}
                      onPress={() => setScheduleDay(w.value)}>
                      <Text style={[ui.chipText, scheduleDay === w.value && ui.chipTextActive]}>
                        {w.label}
                      </Text>
                    </Pressable>
                  ))}
                </Box>
              </>
            ) : null}

            {frequency === 'monthly' ? (
              <>
                <Text style={ui.section}>{t('recurring.dayOfMonth')}</Text>
                <TextInput
                  testID="recurring-dom"
                  style={ui.input}
                  keyboardType="number-pad"
                  value={dayText}
                  onChangeText={value => {
                    setDayText(value);
                    const parsed = parseInt(value, 10);
                    if (Number.isFinite(parsed)) {
                      setScheduleDay(Math.min(Math.max(parsed, 1), 31));
                    }
                  }}
                  placeholder="1"
                  placeholderTextColor={palette.muted}
                />
              </>
            ) : null}

            {frequency === 'custom' ? (
              <>
                <Text style={ui.section}>{t('recurring.custom')}</Text>
                <Box style={ui.chips}>
                  <TextInput
                    testID="recurring-count"
                    style={styles.daysInput}
                    keyboardType="number-pad"
                    value={String(intervalCount)}
                    onChangeText={value => {
                      const parsed = parseInt(value, 10);
                      if (Number.isFinite(parsed) && parsed > 0) {
                        setIntervalCount(Math.min(parsed, 365));
                      }
                    }}
                    placeholder="1"
                    placeholderTextColor={palette.muted}
                  />
                  {UNITS.map(u => {
                    const active = intervalUnit === u;
                    return (
                      <Pressable
                        key={u}
                        testID={`recurring-unit-${u}`}
                        style={[ui.chip, active && ui.chipActive]}
                        onPress={() => setIntervalUnit(u)}>
                        <Text style={[ui.chipText, active && ui.chipTextActive]}>
                          {t(`period.${u}` as 'period.day')}
                        </Text>
                      </Pressable>
                    );
                  })}
                </Box>
              </>
            ) : null}

            <Pressable
              testID="recurring-save"
              style={[ui.actionButton, styles.addButton]}
              onPress={add}>
              <Text style={[ui.actionButtonText, styles.addButtonText]}>{t('common.save')}</Text>
            </Pressable>
          </>
        ) : null}
      </Box>
    </SheetScaffold>
  );
}
