import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { requestWidgetUpdate } from 'react-native-android-widget';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import type { Database } from '@nozbe/watermelondb';
import { database, ensurePerformanceSetup } from '../db/database';
import {
  fetchTransactionsInRange,
  getAccountBalance,
  getEarliestTransactionDate,
  observeTransactionsInRange,
} from '../db/queries';
import { seedDatabase } from '../db/seed';
import { seedMockData } from '../db/mock';
import { MOCK_DATA } from '../config/flags';
import { deleteTransaction, type EntryKind } from '../db/operations';
import { runDueRecurring } from '../db/recurring';
import { activateStreaks, getStreakState, type StreakState } from '../db/streaks';
import { runNotificationChecks, syncScheduledNotifications } from '../notifications/engine';
import { playSound } from '../services/sound';
import { saveWidgetSnapshot } from '../state/widgetData';
import { DocashWidget } from '../widgets/DocashWidget';
import { labelForPeriod, rangeForPeriod, shiftAnchor, type EpochRange, type PeriodKind } from '../utils/dateRange';
import { useEntry } from '../state/useEntry';
import { useFilters } from '../state/useFilters';
import { useSettings } from '../state/useSettings';
import { useTranslation, type TranslationKey } from '../i18n';
import { useMoney } from '../state/useMoney';
import { usePalette, useThemedStyles } from '../theme';
import BalanceHeader from './components/BalanceHeader';
import BudgetsSheet from './components/BudgetsSheet';
import EntryActions from './components/EntryActions';
import EntrySheet from './components/EntrySheet';
import NotificationsSheet from './components/NotificationsSheet';
import PeriodFilter from './components/PeriodFilter';
import RecurringSheet from './components/RecurringSheet';
import StreakCard from './components/StreakCard';
import StreakProgressSheet from './components/StreakProgressSheet';
import StreakReviewSheet from './components/StreakReviewSheet';
import StreakSettingsSheet from './components/StreakSettingsSheet';
import SettingsSheet from './components/SettingsSheet';
import TopBar from './components/TopBar';
import TxRow, { type TxRowData } from './TxRow';
import { Icon, type FeatherName } from './icons';
import { makeStyles } from './HomeScreen.styles';
import { useToast } from './Toast';
import type Account from '../db/models/Account';
import type Category from '../db/models/Category';
import type Budget from '../db/models/Budget';

const CATEGORY_FALLBACK: TranslationKey = 'category.cat_other_exp';
type MainTab = 'home' | 'movements' | 'plan' | 'recurring';
type MovementKind = 'all' | 'income' | 'expense';

/** Actualiza el widget si está instalado; no requiere que exista en el launcher. */
function requestWidgetUpdateAdapter(): void {
  requestWidgetUpdate({
    widgetName: 'DocashWidget',
    renderWidget: () => <DocashWidget />,
  }).catch(() => {});
}

export default function HomeScreen({ db = database }: { db?: Database }) {
  const styles = useThemedStyles(makeStyles);
  const palette = usePalette();
  const money = useMoney();
  const { t, locale } = useTranslation();
  const { showError } = useToast();
  const userName = useSettings(s => s.userName);
  const installedAt = useSettings(s => s.installedAt);
  const setInstalledAt = useSettings(s => s.setInstalledAt);
  const [ready, setReady] = useState(false);
  const [activeTab, setActiveTab] = useState<MainTab>('home');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [streakReviewOpen, setStreakReviewOpen] = useState(false);
  const [streakProgressOpen, setStreakProgressOpen] = useState(false);
  const [streakSettingsOpen, setStreakSettingsOpen] = useState(false);
  const [streakState, setStreakState] = useState<StreakState | null>(null);
  const [recurringFromEntry, setRecurringFromEntry] = useState<{
    kind: EntryKind;
    categoryId?: string;
    amountText?: string;
  } | null>(null);
  const [accountName, setAccountName] = useState('');
  const [accountId, setAccountId] = useState<string | undefined>();
  const [balance, setBalance] = useState(0);
  const [incomeTotal, setIncomeTotal] = useState(0);
  const [expenseTotal, setExpenseTotal] = useState(0);
  const [hasBudget, setHasBudget] = useState(false);
  const [earliestTransactionDate, setEarliestTransactionDate] = useState<number | null>(null);
  const [rows, setRows] = useState<TxRowData[]>([]);
  const tabProgress = useSharedValue(1);
  const hasRenderedTabs = useRef(false);
  const tabAnimatedStyle = useAnimatedStyle(() => ({
    opacity: tabProgress.value,
    transform: [{ translateY: (1 - tabProgress.value) * 10 }],
  }));

  const period = useFilters(s => s.period);
  const anchorMs = useFilters(s => s.anchorMs);
  const setPeriod = useFilters(s => s.setPeriod);
  const setAnchorMs = useFilters(s => s.setAnchorMs);
  const entryOpen = useEntry(s => s.open);
  const openSheet = useEntry(s => s.openSheet);
  const openEdit = useEntry(s => s.openEdit);
  const currentRange = useMemo(() => rangeForPeriod(period, anchorMs), [period, anchorMs]);

  useEffect(() => {
    if (!installedAt) {
      setInstalledAt(Date.now());
    }
  }, [installedAt, setInstalledAt]);

  useEffect(() => {
    let cancelled = false;
    const range = rangeForPeriod(period, anchorMs);
    const subscription = observeTransactionsInRange(db, range).subscribe(() => {
      refresh(range).catch(error => showError(error, 'errors.refresh'));
    });

    async function refresh(activeRange: EpochRange | null) {
      const accounts = await db.get<Account>('accounts').query().fetch();
      const account = accounts[0] ?? null;
      if (cancelled) {
        return;
      }
      if (!account) {
        setReady(true);
        return;
      }
      const [nextBalance, txs, categories, earliestDate] = await Promise.all([
        getAccountBalance(db, account),
        fetchTransactionsInRange(db, activeRange),
        db.get<Category>('categories').query().fetch(),
        getEarliestTransactionDate(db),
      ]);
      if (cancelled) {
        return;
      }
      setAccountId(account.id);
      setAccountName(account.name);
      setBalance(nextBalance);
      setEarliestTransactionDate(earliestDate);
      setIncomeTotal(txs.reduce((sum, tx) => sum + (tx.kind === 'income' ? tx.amountCents : 0), 0));
      setExpenseTotal(txs.reduce((sum, tx) => sum + (tx.kind === 'expense' ? tx.amountCents : 0), 0));
      saveWidgetSnapshot(nextBalance);
      requestWidgetUpdateAdapter();
      const byId = new Map(categories.map(category => [category.id, category]));
      setRows(
        txs.slice(0, 100).map(tx => {
          const cat = tx.categoryId ? byId.get(tx.categoryId) : undefined;
          const key = `category.${cat?.id ?? ''}` as TranslationKey;
          const translated = cat ? t(key) : t(CATEGORY_FALLBACK);
          return {
            id: tx.id,
            categoryId: cat?.id,
            icon: cat?.icon,
            title: cat ? (translated === key ? cat.name : translated) : t(CATEGORY_FALLBACK),
            note: tx.note,
            occurredOn: tx.occurredOn,
            amountCents: tx.amountCents,
            kind: tx.kind,
          };
        }),
      );
      setReady(true);
    }

    (async () => {
      await ensurePerformanceSetup(db);
      await seedDatabase(db);
      if (MOCK_DATA) {
        await seedMockData(db);
      }
      await runDueRecurring(db);
      await syncScheduledNotifications(db).catch(error => showError(error, 'errors.generic'));
      await runNotificationChecks(db).catch(error => showError(error, 'errors.generic'));
      if (!cancelled) {
        await refresh(range);
      }
    })();

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [db, period, anchorMs, t, locale, showError]);

  useEffect(() => {
    const subscription = db.get<Budget>('budgets').query().observe().subscribe(budgets => {
      setHasBudget(budgets.length > 0);
    });
    return () => subscription.unsubscribe();
  }, [db]);

  useEffect(() => {
    if (!hasRenderedTabs.current) {
      hasRenderedTabs.current = true;
      return;
    }
    tabProgress.value = 0;
    tabProgress.value = withTiming(1, { duration: 240 });
  }, [activeTab, tabProgress]);

  const minDate = Math.min(installedAt || Infinity, earliestTransactionDate || Infinity);
  const canGoPrev = currentRange ? currentRange.from > minDate : true;
  const periodLabel = period === 'all'
    ? t('period.allTime')
    : labelForPeriod(period, anchorMs, locale === 'es' ? 'es-ES' : 'en-US');
  // Las hojas de racha son Actionsheets: Inicio debe permanecer visible debajo del backdrop.
  const routeOpen = entryOpen || settingsOpen || notificationsOpen;

  const refreshStreak = useCallback(async () => {
    try {
      setStreakState(await getStreakState(db));
    } catch (error) {
      showError(error, 'errors.streakLoad');
    }
  }, [db, showError]);

  useEffect(() => {
    refreshStreak().catch(() => {});
  }, [refreshStreak]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') {
        refreshStreak().catch(() => {});
        syncScheduledNotifications(db).catch(error => showError(error, 'errors.generic'));
      }
    });
    const timer = setInterval(() => refreshStreak().catch(() => {}), 60_000);
    return () => {
      subscription.remove();
      clearInterval(timer);
    };
  }, [db, refreshStreak, showError]);

  const activateAndReview = async () => {
    try {
      await activateStreaks(db);
      await refreshStreak();
      setStreakReviewOpen(true);
    } catch (error) {
      showError(error, 'errors.streakSave');
    }
  };

  const editRow = (id: string) => {
    const row = rows.find(item => item.id === id);
    if (row && row.kind !== 'transfer') {
      openEdit({
        id: row.id,
        kind: row.kind,
        amountCents: row.amountCents,
        categoryId: row.categoryId,
        note: row.note,
        occurredOn: row.occurredOn,
      });
    }
  };

  const confirmDelete = (id: string) => {
    Alert.alert(t('entry.delete'), t('tx.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('entry.delete'),
        style: 'destructive',
        onPress: () => {
          playSound('delete');
          deleteTransaction(db, id).catch(error => showError(error, 'errors.delete'));
        },
      },
    ]);
  };

  if (!ready) {
    return <SafeAreaView style={styles.center}><ActivityIndicator size="large" color={palette.primary} /></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.root}>
      {!routeOpen ? (
        <>
          {activeTab === 'home' ? (
            <Animated.View style={[styles.screenTransition, tabAnimatedStyle]}>
            <ScrollView contentContainerStyle={styles.homeContent}>
              <TopBar userName={userName} title={t('nav.home')} flush onOpenSettings={() => setSettingsOpen(true)} />
              <View style={styles.balanceCard}>
                <BalanceHeader balanceCents={balance} accountName={accountName} accountId={accountId} variant="hero" />
              </View>
              <EntryActions onExpense={() => openSheet('expense')} />
              <Text style={styles.monthLabel}>{periodLabel}</Text>
              <View style={styles.summaryRow}>
                <View style={[styles.summaryCard, styles.incomeCard]}>
                  <View style={styles.summaryIconIncome}><Icon name="ArrowDown" color={palette.income} size={25} strokeWidth={2.5} /></View>
                  <View>
                    <Text style={styles.summaryLabel}>{t('home.monthIncome')}</Text>
                    <Text style={[styles.summaryAmount, styles.incomeAmount]}>{`+${money(incomeTotal)}`}</Text>
                  </View>
                </View>
                <View style={[styles.summaryCard, styles.expenseCard]}>
                  <View style={styles.summaryIconExpense}><Icon name="ArrowUp" color={palette.ink} size={25} strokeWidth={2.5} /></View>
                  <View>
                    <Text style={styles.summaryLabel}>{t('home.monthExpense')}</Text>
                    <Text style={[styles.summaryAmount, styles.expenseAmount]}>{money(expenseTotal)}</Text>
                  </View>
                </View>
              </View>
              <StreakCard
                state={streakState}
                onActivate={activateAndReview}
                onReview={() => setStreakReviewOpen(true)}
                onProgress={() => setStreakProgressOpen(true)}
              />
              {!hasBudget ? <View style={styles.planPrompt}>
                <View style={styles.planIcon}><Icon name="PieChart" color={palette.primary} size={32} strokeWidth={2.5} /></View>
                <View style={styles.planCopy}>
                  <Text style={styles.cardTitle}>{t('home.planPromptTitle')}</Text>
                  <Text style={styles.helperText}>{t('home.planPromptBody', { amount: money(balance) })}</Text>
                  <Pressable style={styles.budgetButton} onPress={() => setActiveTab('plan')}>
                    <Text style={styles.budgetButtonText}>{t('home.createBudget')}</Text>
                    <Icon name="ChevronRight" color={palette.primary} size={24} strokeWidth={2.5} />
                  </Pressable>
                </View>
              </View> : null}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{t('home.recent')}</Text>
                <Pressable onPress={() => setActiveTab('movements')} style={styles.viewAllButton}>
                  <Text style={styles.viewAllText}>{t('home.viewAll')}</Text>
                  <Icon name="ChevronRight" color={palette.primary} size={24} strokeWidth={2.5} />
                </Pressable>
              </View>
              {rows.slice(0, 3).map(row => (
                <TxRow key={row.id} row={row} onPress={editRow} onDelete={confirmDelete} />
              ))}
            </ScrollView>
            </Animated.View>
          ) : null}

          {activeTab === 'movements' ? (
            <Animated.View style={[styles.screenTransition, tabAnimatedStyle]}><MovementsPage
              rows={rows}
              period={period}
              anchorMs={anchorMs}
              canGoPrev={canGoPrev}
              onPeriodChange={setPeriod}
              onShift={direction => setAnchorMs(shiftAnchor(period, anchorMs, direction))}
              onOpenSettings={() => setSettingsOpen(true)}
              onEdit={editRow}
              onDelete={confirmDelete}
              onAdd={() => openSheet('expense')}
            /></Animated.View>
          ) : null}

          {activeTab === 'plan' ? (
            <Animated.View style={[styles.screenTransition, tabAnimatedStyle]}><BudgetsSheet
              isOpen
              onClose={() => setActiveTab('home')}
              onOpenSettings={() => setSettingsOpen(true)}
              db={db}
              presentation="page"
            /></Animated.View>
          ) : null}
          {activeTab === 'recurring' ? (
            <Animated.View style={[styles.screenTransition, tabAnimatedStyle]}><RecurringSheet
              isOpen
              onClose={() => setActiveTab('home')}
              onOpenSettings={() => setSettingsOpen(true)}
              db={db}
              presentation="page"
            /></Animated.View>
          ) : null}
          <BottomTabs active={activeTab} onChange={setActiveTab} />
        </>
      ) : null}

      <EntrySheet db={db} presentation="page" onOpenRecurring={setRecurringFromEntry} />
      <SettingsSheet
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        db={db}
        presentation="page"
        onOpenNotifications={() => { setSettingsOpen(false); setNotificationsOpen(true); }}
        onOpenStreakSettings={() => { setSettingsOpen(false); setStreakSettingsOpen(true); }}
      />
      <NotificationsSheet
        isOpen={notificationsOpen}
        onClose={() => { setNotificationsOpen(false); setSettingsOpen(true); }}
        presentation="page"
      />
      <RecurringSheet
        isOpen={recurringFromEntry !== null}
        onClose={() => setRecurringFromEntry(null)}
        db={db}
        presentation="sheet"
        initial={recurringFromEntry ?? undefined}
      />
      <StreakReviewSheet
        db={db}
        isOpen={streakReviewOpen}
        onClose={() => setStreakReviewOpen(false)}
        onAddMovement={() => { setStreakReviewOpen(false); openSheet('expense'); }}
        onEditMovement={id => { setStreakReviewOpen(false); editRow(id); }}
        onChanged={refreshStreak}
        presentation="sheet"
      />
      <StreakProgressSheet
        db={db}
        isOpen={streakProgressOpen}
        onClose={() => setStreakProgressOpen(false)}
        onOpenSettings={() => { setStreakProgressOpen(false); setStreakSettingsOpen(true); }}
        presentation="sheet"
      />
      <StreakSettingsSheet
        db={db}
        isOpen={streakSettingsOpen}
        onClose={() => setStreakSettingsOpen(false)}
        onChanged={refreshStreak}
        presentation="sheet"
      />
    </SafeAreaView>
  );
}

function MovementsPage({
  rows,
  period,
  anchorMs,
  canGoPrev,
  onPeriodChange,
  onShift,
  onOpenSettings,
  onEdit,
  onDelete,
  onAdd,
}: {
  rows: TxRowData[];
  period: PeriodKind;
  anchorMs: number;
  canGoPrev: boolean;
  onPeriodChange: (period: PeriodKind) => void;
  onShift: (direction: 1 | -1) => void;
  onOpenSettings: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}) {
  const styles = useThemedStyles(makeStyles);
  const palette = usePalette();
  const { t } = useTranslation();
  const [kind, setKind] = useState<MovementKind>('all');
  const [search, setSearch] = useState('');
  const filtered = rows.filter(row =>
    (kind === 'all' || row.kind === kind) &&
    `${row.title} ${row.note}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()),
  );
  const filters: { value: MovementKind; label: string }[] = [
    { value: 'all', label: t('movement.all') },
    { value: 'income', label: t('movement.incomes') },
    { value: 'expense', label: t('movement.expenses') },
  ];

  return (
    <View style={styles.page}>
      <TopBar userName="" title={t('nav.movements')} onOpenSettings={onOpenSettings} />
      <PeriodFilter
        period={period}
        anchorMs={anchorMs}
        onPeriodChange={onPeriodChange}
        onShift={onShift}
        canGoPrev={canGoPrev}
      />
      <TextInput
        testID="movement-search"
        value={search}
        onChangeText={setSearch}
        placeholder={`${t('movement.search')} · ${t('movement.searchPlaceholder')}`}
        placeholderTextColor={palette.muted}
        style={styles.searchInput}
      />
      <View style={styles.filterRow}>
        {filters.map(filter => {
          const active = kind === filter.value;
          return (
            <Pressable
              key={filter.value}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => setKind(filter.value)}>
              <Text style={[styles.filterText, active && styles.filterTextActive]}>{filter.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <ScrollView contentContainerStyle={styles.movementList}>
        {filtered.map(row => <TxRow key={row.id} row={row} onPress={onEdit} onDelete={onDelete} />)}
        {!filtered.length ? <Text style={styles.emptyText}>{t('list.empty')}</Text> : null}
        <Pressable style={styles.primaryButton} onPress={onAdd}>
          <Text style={styles.primaryButtonText}>{`＋ ${t('movement.register')}`}</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>{t('movement.summary')}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function BottomTabs({ active, onChange }: { active: MainTab; onChange: (tab: MainTab) => void }) {
  const styles = useThemedStyles(makeStyles);
  const palette = usePalette();
  const { t } = useTranslation();
  const tabs: { id: MainTab; label: string }[] = [
    { id: 'home', label: t('nav.home') },
    { id: 'movements', label: t('nav.movements') },
    { id: 'plan', label: t('nav.plan') },
    { id: 'recurring', label: t('nav.recurring') },
  ];
  const icons: Record<MainTab, FeatherName> = {
    home: 'Home',
    movements: 'FileText',
    plan: 'PieChart',
    recurring: 'RefreshCw',
  };
  return (
    <View style={styles.bottomTabs}>
      {tabs.map(tab => (
        <Pressable
          key={tab.id}
          testID={`tab-${tab.id}`}
          accessibilityRole="button"
          accessibilityState={{ selected: active === tab.id }}
          style={[styles.tabButton, active === tab.id && styles.tabButtonActive]}
          onPress={() => onChange(tab.id)}>
          <Icon name={icons[tab.id]} color={active === tab.id ? palette.primary : palette.muted} size={25} strokeWidth={2.2} />
          <Text style={[styles.tabLabel, active === tab.id && styles.tabLabelActive]}>{tab.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}
