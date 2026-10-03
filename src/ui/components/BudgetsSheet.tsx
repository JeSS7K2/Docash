import React, { useEffect, useState } from 'react';
import { Pressable } from 'react-native';
import { Box, Text } from '@gluestack-ui/themed';
import { ChevronRight, Trash2 } from 'react-native-feather';
import type { Database } from '@nozbe/watermelondb';
import { Q } from '@nozbe/watermelondb';
import type Category from '../../db/models/Category';
import type Budget from '../../db/models/Budget';
import type Goal from '../../db/models/Goal';
import { getBudgets } from '../../db/budgets';
import { getGoals, getGoalProgressCents, removeGoal } from '../../db/goals';
import { getCategorySpentInRange } from '../../db/queries';
import { budgetWindow } from '../../utils/schedule';
import { useMoney } from '../../state/useMoney';
import { useTranslation, type TranslationKey } from '../../i18n';
import { usePalette, useThemedStyles } from '../../theme';
import { CategoryIcon } from '../icons';
import BudgetConfigSheet from './BudgetConfigSheet';
import GoalsConfigSheet from './GoalsConfigSheet';
import SheetScaffold from './SheetScaffold';
import { makeSheetUi } from './sheetUi.styles';
import { makeStyles } from './BudgetsSheet.styles';
import { useToast } from '../Toast';

interface BudgetsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  db: Database;
}

/** Lista limpia de presupuestos; se configura en un modal dedicado. */
export default function BudgetsSheet({ isOpen, onClose, db }: BudgetsSheetProps) {
  const ui = useThemedStyles(makeSheetUi);
  const styles = useThemedStyles(makeStyles);
  const palette = usePalette();
  const money = useMoney();
  const { t, locale } = useTranslation();
  const { showError } = useToast();

  const [cats, setCats] = useState<Category[]>([]);
  const [budgetMap, setBudgetMap] = useState<Record<string, Budget>>({});
  const [spent, setSpent] = useState<Record<string, number>>({});
  const [configCat, setConfigCat] = useState<Category | null>(null);
  const [goals, setGoals] = useState<{ goal: Goal; progress: number }[]>([]);
  const [goalConfigOpen, setGoalConfigOpen] = useState(false);

  const load = async () => {
    const [categories, budgets, goalList] = await Promise.all([
      db
        .get<Category>('categories')
        .query(Q.where('kind', 'expense'), Q.sortBy('sort_order', Q.asc))
        .fetch(),
      getBudgets(db),
      getGoals(db),
    ]);
    const map: Record<string, Budget> = {};
    const spentMap: Record<string, number> = {};
    const now = Date.now();
    for (const b of budgets) {
      map[b.categoryId] = b;
      spentMap[b.categoryId] = await getCategorySpentInRange(
        db,
        b.categoryId,
        budgetWindow(b.period ?? 'monthly', b.intervalDays ?? 1, b.intervalUnit ?? 'day', now),
      );
    }
    const goalProgress = await Promise.all(
      goalList.map(async goal => ({ goal, progress: await getGoalProgressCents(db, goal) })),
    );
    setCats(categories);
    setBudgetMap(map);
    setSpent(spentMap);
    setGoals(goalProgress);
  };

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    load().catch(error => showError(error, 'errors.budgetsLoad'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, db]);

  return (
    <>
      <SheetScaffold
        isOpen={isOpen}
        onClose={onClose}
        title={t('budgets.title')}
        accent={palette.budget}
        accentSoft={palette.budgetSoft}
        closeTestID="budgets-close">
        <Box style={ui.body}>
          {cats.map(cat => {
            const key = `category.${cat.id}` as TranslationKey;
            const translated = t(key);
            const label = translated === key ? cat.name : translated;
            const budget = budgetMap[cat.id];
            const sp = spent[cat.id] ?? 0;
            const b = budget?.amountCents ?? 0;
            const period = budget?.period ?? 'monthly';
            const interval = budget?.intervalDays ?? 1;
            const unit = budget?.intervalUnit ?? 'day';
            const over = b > 0 && sp > b;
            const periodLabel =
              period === 'custom'
                ? `${interval} ${t(`period.${unit}` as 'period.day')}`
                : t(`budgets.period.${period}` as 'budgets.period.monthly');
            return (
              <Pressable
                key={cat.id}
                testID={`budget-row-${cat.id}`}
                style={styles.rowButton}
                onPress={() => setConfigCat(cat)}>
                <CategoryIcon id={cat.id} icon={cat.icon} color={palette.ink} size={20} />
                <Box style={ui.spacer}>
                  <Text style={ui.rowTitle}>{label}</Text>
                  {b > 0 ? (
                    <>
                      <Box style={styles.barTrack}>
                        <Box
                          style={[
                            styles.barFill,
                            !over && styles.barFillOk,
                            { width: `${Math.min(sp / b, 1) * 100}%` },
                          ]}
                        />
                      </Box>
                      <Box style={styles.metaRow}>
                        <Text style={ui.rowMeta}>{`${money(sp)} / ${money(b)}`}</Text>
                        <Text style={[ui.rowMeta, over && { color: palette.expense }]}>
                          {periodLabel}
                        </Text>
                      </Box>
                    </>
                  ) : (
                    <Text style={ui.rowMeta}>{t('budgets.setBudget')}</Text>
                  )}
                </Box>
                <ChevronRight
                  width={20}
                  height={20}
                  color={palette.muted}
                  strokeWidth={2}
                  style={styles.chevron}
                />
              </Pressable>
            );
          })}

          <Text style={ui.section}>{t('goals.title')}</Text>
          {goals.length === 0 ? <Text style={ui.rowMeta}>{t('goals.empty')}</Text> : null}
          {goals.map(({ goal, progress }) => {
            const pct = goal.targetCents > 0 ? Math.min(progress / goal.targetCents, 1) : 0;
            const reached = progress >= goal.targetCents;
            const deadlineLabel = goal.deadline
              ? new Date(goal.deadline).toLocaleDateString(
                  locale === 'es' ? 'es-ES' : 'en-US',
                  { day: '2-digit', month: 'short', year: 'numeric' },
                )
              : t('goals.indefinite');
            return (
              <Box key={goal.id} style={ui.row}>
                <Box style={ui.spacer}>
                  <Box style={styles.titleRow}>
                    <Text style={ui.rowTitle}>{goal.name}</Text>
                    <Pressable
                      testID={`goal-delete-${goal.id}`}
                      onPress={() => {
                        removeGoal(db, goal.id)
                          .then(load)
                          .catch(error => showError(error, 'errors.goalDelete'));
                      }}>
                      <Trash2 width={18} height={18} color={palette.expense} strokeWidth={2} />
                    </Pressable>
                  </Box>
                  <Box style={styles.barTrack}>
                    <Box
                      style={[
                        styles.barFill,
                        reached && styles.barFillOk,
                        { width: `${pct * 100}%` },
                      ]}
                    />
                  </Box>
                  <Box style={styles.metaRow}>
                    <Text style={ui.rowMeta}>{`${money(progress)} / ${money(goal.targetCents)}`}</Text>
                    <Text style={ui.rowMeta}>{deadlineLabel}</Text>
                  </Box>
                </Box>
              </Box>
            );
          })}
          <Pressable
            testID="goal-add"
            style={[ui.actionButton, styles.deleteButton]}
            onPress={() => setGoalConfigOpen(true)}>
            <Text style={ui.actionButtonText}>{t('goals.add')}</Text>
          </Pressable>
        </Box>
      </SheetScaffold>
      <BudgetConfigSheet
        isOpen={configCat !== null}
        category={configCat}
        db={db}
        onClose={() => {
          setConfigCat(null);
          load().catch(error => showError(error, 'errors.budgetsLoad'));
        }}
      />
      <GoalsConfigSheet
        isOpen={goalConfigOpen}
        db={db}
        onClose={() => {
          setGoalConfigOpen(false);
          load().catch(error => showError(error, 'errors.budgetsLoad'));
        }}
      />
    </>
  );
}
