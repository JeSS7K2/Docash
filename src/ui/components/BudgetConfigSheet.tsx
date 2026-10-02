import React, { useEffect, useState } from 'react';
import { TextInput } from 'react-native';
import { Box, Pressable, Text } from '@gluestack-ui/themed';
import type { Database } from '@nozbe/watermelondb';
import type Category from '../../db/models/Category';
import { getBudgets, removeBudget, setBudget } from '../../db/budgets';
import { getCategorySpentInRange } from '../../db/queries';
import { toCents } from '../../utils/currency';
import { baseToDisplayCents, displayToBaseCents } from '../../utils/fx';
import { budgetWindow, type BudgetPeriod } from '../../utils/schedule';
import { useMoney } from '../../state/useMoney';
import { useSettings } from '../../state/useSettings';
import { useTranslation, type TranslationKey } from '../../i18n';
import { usePalette, useThemedStyles } from '../../theme';
import SheetScaffold from './SheetScaffold';
import { makeSheetUi } from './sheetUi.styles';
import { makeStyles } from './BudgetsSheet.styles';

interface BudgetConfigSheetProps {
  isOpen: boolean;
  onClose: () => void;
  db: Database;
  category: Category | null;
}

const PERIODS: BudgetPeriod[] = ['daily', 'weekly', 'monthly'];

/** Configuración del presupuesto de UNA categoría (modal dedicado). */
export default function BudgetConfigSheet({ isOpen, onClose, db, category }: BudgetConfigSheetProps) {
  const ui = useThemedStyles(makeSheetUi);
  const styles = useThemedStyles(makeStyles);
  const palette = usePalette();
  const money = useMoney();
  const { t } = useTranslation();
  const currency = useSettings(s => s.currency);
  const rate = useSettings(s => s.exchangeRate);

  const [amountText, setAmountText] = useState('');
  const [period, setPeriod] = useState<BudgetPeriod>('monthly');
  const [spent, setSpent] = useState(0);

  useEffect(() => {
    if (!isOpen || !category) {
      return;
    }
    let cancelled = false;
    (async () => {
      const budgets = await getBudgets(db);
      const b = budgets.find(x => x.categoryId === category.id);
      const p: BudgetPeriod = b?.period ?? 'monthly';
      const sp = b
        ? await getCategorySpentInRange(db, category.id, budgetWindow(p, 1, 'day', Date.now()))
        : 0;
      if (cancelled) {
        return;
      }
      setAmountText(b ? String(baseToDisplayCents(b.amountCents, currency, rate) / 100) : '');
      setPeriod(p);
      setSpent(sp);
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, category, db, currency, rate]);

  if (!category) {
    return null;
  }

  const catKey = `category.${category.id}` as TranslationKey;
  const translated = t(catKey);
  const title = translated === catKey ? category.name : translated;

  const baseCents = (() => {
    try {
      return displayToBaseCents(toCents(amountText === '' ? '0' : amountText), currency, rate);
    } catch {
      return 0;
    }
  })();
  const pct = baseCents > 0 ? Math.min(spent / baseCents, 1) : 0;
  const over = baseCents > 0 && spent > baseCents;

  const save = async () => {
    await setBudget(db, category.id, baseCents, period);
    onClose();
  };
  const remove = async () => {
    await removeBudget(db, category.id);
    onClose();
  };

  return (
    <SheetScaffold
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      accent={palette.budget}
      accentSoft={palette.budgetSoft}
      closeTestID="budget-config-close">
      <Box style={styles.configBody}>
        <Text style={ui.section}>{t('budgets.set')}</Text>
        <TextInput
          testID="budget-config-amount"
          style={ui.input}
          keyboardType="decimal-pad"
          value={amountText}
          onChangeText={setAmountText}
          placeholder="0"
          placeholderTextColor={palette.muted}
        />

        <Text style={ui.section}>{t('budgets.period')}</Text>
        <Box style={styles.periodRow}>
          {PERIODS.map(p => {
            const active = period === p;
            return (
              <Pressable
                key={p}
                testID={`budget-config-period-${p}`}
                style={[ui.chip, styles.periodChip, active && ui.chipActive]}
                onPress={() => setPeriod(p)}>
                <Text style={[ui.chipText, active && ui.chipTextActive]}>
                  {t(`budgets.period.${p}` as 'budgets.period.monthly')}
                </Text>
              </Pressable>
            );
          })}
        </Box>

        {baseCents > 0 ? (
          <>
            <Box style={styles.barTrack}>
              <Box
                style={[styles.barFill, !over && styles.barFillOk, { width: `${pct * 100}%` }]}
              />
            </Box>
            <Box style={styles.metaRow}>
              <Text style={ui.rowMeta}>{`${money(spent)} / ${money(baseCents)}`}</Text>
              {over ? (
                <Text style={[ui.rowMeta, { color: palette.expense }]}>{t('budgets.over')}</Text>
              ) : null}
            </Box>
          </>
        ) : null}

        <Pressable testID="budget-config-save" style={[ui.actionButton, styles.saveButton]} onPress={save}>
          <Text style={ui.actionButtonText}>{t('common.save')}</Text>
        </Pressable>
        <Pressable testID="budget-config-delete" style={[ui.actionButton, styles.deleteButton]} onPress={remove}>
          <Text style={[ui.actionButtonText, { color: palette.expense }]}>{t('entry.delete')}</Text>
        </Pressable>
      </Box>
    </SheetScaffold>
  );
}
