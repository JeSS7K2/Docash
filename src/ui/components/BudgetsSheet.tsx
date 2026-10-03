import React, { useEffect, useState } from 'react';
import { Pressable } from 'react-native';
import { Box, Text } from '@gluestack-ui/themed';
import { Trash2 } from 'react-native-feather';
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
  presentation?: 'sheet' | 'page';
}

/** Lista limpia de presupuestos; se configura en un modal dedicado. */
export default function BudgetsSheet({ isOpen, onClose, db, presentation = 'sheet' }: BudgetsSheetProps) {
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
  const [view, setView] = useState<'budgets' | 'goals'>('budgets');
  const monthlyTotal = Object.values(budgetMap).reduce(
    (sum, budget) => sum + (budget.period === 'monthly' || !budget.period ? budget.amountCents : 0),
    0,
  );
  const planTabs = (
    <Box style={styles.segmentRow}>
      {(['budgets', 'goals'] as const).map(tab => {
        const active = view === tab;
        return (
          <Pressable
            key={tab}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={[styles.segment, active && styles.segmentActive]}
            onPress={() => setView(tab)}>
            <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
              {t(tab === 'budgets' ? 'budgets.title' : 'goals.title')}
            </Text>
          </Pressable>
        );
      })}
    </Box>
  );

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
        isOpen={isOpen && !(presentation === 'page' && (configCat !== null || goalConfigOpen))}
        onClose={onClose}
        title={t('plan.title')}
        accent={palette.budget}
        accentSoft={palette.budgetSoft}
        closeTestID="budgets-close"
        presentation={presentation}
        fixedContent={planTabs}>
        <Box style={ui.body}>
          {view === 'budgets' ? (
            <>
              <Box style={styles.totalCard}>
                <Text style={styles.totalLabel}>{t('plan.monthlyBudget')}</Text>
                <Text style={styles.totalAmount}>{money(monthlyTotal)}</Text>
                <Text style={styles.totalNote}>{t('plan.budgetNote')}</Text>
              </Box>
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
                    style={styles.budgetCard}
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
                                over && { backgroundColor: palette.expense },
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
                    <Text style={styles.editText}>{`${t('plan.edit')} ›`}</Text>
                  </Pressable>
                );
              })}
            </>
          ) : (
            <>
              <Box style={styles.goalsIntro}>
                <Text style={styles.goalsIntroTitle}>{t('plan.goalsIntro')}</Text>
                <Text style={styles.goalsIntroBody}>{t('plan.goalsBody')}</Text>
                <Pressable
                  testID="goal-add"
                  style={styles.goalAddButton}
                  onPress={() => setGoalConfigOpen(true)}>
                  <Text style={styles.goalAddText}>{t('goals.add')}</Text>
                </Pressable>
              </Box>
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
              <Box key={goal.id} style={[ui.row, styles.goalCard]}>
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
            </>
          )}
        </Box>
      </SheetScaffold>
      <BudgetConfigSheet
        isOpen={configCat !== null}
        category={configCat}
        db={db}
        presentation={presentation}
        onClose={() => {
          setConfigCat(null);
          load().catch(error => showError(error, 'errors.budgetsLoad'));
        }}
      />
      <GoalsConfigSheet
        isOpen={goalConfigOpen}
        db={db}
        presentation={presentation}
        onClose={() => {
          setGoalConfigOpen(false);
          load().catch(error => showError(error, 'errors.budgetsLoad'));
        }}
      />
    </>
  );
}
