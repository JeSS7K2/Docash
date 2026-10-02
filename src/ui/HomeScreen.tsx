import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, SafeAreaView, Text } from 'react-native';
import { requestWidgetUpdate } from 'react-native-android-widget';
import type { Database } from '@nozbe/watermelondb';
import { database, ensurePerformanceSetup } from '../db/database';
import {
  fetchTransactionsInRange,
  getAccountBalance,
  getEarliestTransactionDate,
  getPieInRange,
  observeTransactionsInRange,
  type PieSlice,
} from '../db/queries';
import { seedDatabase } from '../db/seed';
import { seedMockData } from '../db/mock';
import { MOCK_DATA } from '../config/flags';
import { deleteTransaction } from '../db/operations';
import { runDueRecurring } from '../db/recurring';
import { runNotificationChecks, syncScheduledNotifications } from '../notifications/engine';
import { playSound } from '../services/sound';
import { saveWidgetSnapshot } from '../state/widgetData';
import { DocashWidget } from '../widgets/DocashWidget';
import { labelForPeriod, rangeForPeriod, shiftAnchor, type EpochRange } from '../utils/dateRange';
import { buildTrend, type TrendBucket } from '../utils/trend';
import { useEntry } from '../state/useEntry';
import { useFilters } from '../state/useFilters';
import { useSettings } from '../state/useSettings';
import { useTranslation, type TranslationKey } from '../i18n';
import { usePalette, useThemedStyles } from '../theme';
import BalanceHeader from './components/BalanceHeader';
import BudgetsSheet from './components/BudgetsSheet';
import EntryActions from './components/EntryActions';
import EntrySheet from './components/EntrySheet';
import MonthDonut from './components/MonthDonut';
import NotificationsSheet from './components/NotificationsSheet';
import PeriodFilter from './components/PeriodFilter';
import RecurringSheet from './components/RecurringSheet';
import SettingsSheet from './components/SettingsSheet';
import TopBar from './components/TopBar';
import TransactionList from './components/TransactionList';
import TrendChart from './components/TrendChart';
import type { TxRowData } from './TxRow';
import { makeStyles } from './HomeScreen.styles';
import type Account from '../db/models/Account';
import type Category from '../db/models/Category';
import type Transaction from '../db/models/Transaction';

const CATEGORY_FALLBACK: TranslationKey = 'category.cat_other_exp';
const sumExpenses = (slices: PieSlice[]) => slices.reduce((acc, s) => acc + s.totalCents, 0);

/** Refresca el widget si está colocado en el launcher. Silencioso si no. */
function requestWidgetUpdateAdapter(): void {
  requestWidgetUpdate({
    widgetName: 'DocashWidget',
    renderWidget: () => <DocashWidget />,
  }).catch(() => {
    // Sin widget en el launcher: no es un error.
  });
}

/** Home: TopBar + balance + periodo + donut + tendencia + lista. */
export default function HomeScreen({ db = database }: { db?: Database }) {
  const styles = useThemedStyles(makeStyles);
  const palette = usePalette();
  const { t, locale } = useTranslation();
  const userName = useSettings(s => s.userName);
  const installedAt = useSettings(s => s.installedAt);
  const setInstalledAt = useSettings(s => s.setInstalledAt);
  const chartWidth = Dimensions.get('window').width - 32;

  const [ready, setReady] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [budgetsOpen, setBudgetsOpen] = useState(false);
  const [recurringOpen, setRecurringOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [accountName, setAccountName] = useState('');
  const [accountId, setAccountId] = useState<string | undefined>(undefined);
  const [balance, setBalance] = useState(0);
  const [pie, setPie] = useState<PieSlice[]>([]);
  const [prevTotal, setPrevTotal] = useState<number | null>(null);
  const [trend, setTrend] = useState<TrendBucket[]>([]);
  const [rows, setRows] = useState<TxRowData[]>([]);
  const [earliestTxAt, setEarliestTxAt] = useState<number | null>(null);

  const period = useFilters(s => s.period);
  const anchorMs = useFilters(s => s.anchorMs);
  const setPeriod = useFilters(s => s.setPeriod);
  const setAnchorMs = useFilters(s => s.setAnchorMs);
  const openSheet = useEntry(s => s.openSheet);
  const openEdit = useEntry(s => s.openEdit);

  // Primer arranque: sella la fecha de instalación.
  useEffect(() => {
    if (installedAt === 0) {
      setInstalledAt(Date.now());
    }
  }, [installedAt, setInstalledAt]);

  // Límite inferior de navegación: instalación (o import si es anterior).
  const minDate = useMemo(() => {
    const candidates = [installedAt > 0 ? installedAt : Infinity, earliestTxAt ?? Infinity];
    return Math.min(...candidates);
  }, [installedAt, earliestTxAt]);

  const currentRange = useMemo(() => rangeForPeriod(period, anchorMs), [period, anchorMs]);
  const canGoPrev = currentRange ? currentRange.from > minDate : true;

  const periodLabel = useMemo(
    () =>
      period === 'all'
        ? t('period.allTime')
        : labelForPeriod(period, anchorMs, locale === 'es' ? 'es-ES' : 'en-US'),
    [period, anchorMs, locale, t],
  );

  const currentTotal = useMemo(() => sumExpenses(pie), [pie]);

  const changePct = useMemo(() => {
    if (period === 'all' || prevTotal === null || prevTotal <= 0) {
      return null;
    }
    return Math.round(((currentTotal - prevTotal) / prevTotal) * 100);
  }, [period, prevTotal, currentTotal]);

  useEffect(() => {
    let cancelled = false;
    const range = rangeForPeriod(period, anchorMs);
    const prevRange: EpochRange | null =
      period === 'all' ? null : rangeForPeriod(period, shiftAnchor(period, anchorMs, -1));

    const subscription = observeTransactionsInRange(db, range).subscribe(() => {
      refresh(range, prevRange).catch(error => console.error('[home] refresh failed', error));
    });

    async function refresh(activeRange: EpochRange | null, previousRange: EpochRange | null) {
      const accounts = await db.get<Account>('accounts').query().fetch();
      const account = accounts[0] ?? null;
      if (cancelled) {
        return;
      }
      if (!account) {
        setReady(true);
        return;
      }
      const [nextBalance, nextPie, prevPie, txs, categories, earliest] = await Promise.all([
        getAccountBalance(db, account),
        getPieInRange(db, activeRange),
        previousRange ? getPieInRange(db, previousRange) : Promise.resolve<PieSlice[]>([]),
        fetchTransactionsInRange(db, activeRange),
        db.get<Category>('categories').query().fetch(),
        getEarliestTransactionDate(db),
      ]);
      if (cancelled) {
        return;
      }
      setEarliestTxAt(earliest);
      const byId = new Map(categories.map(c => [c.id, c]));
      setAccountId(account.id);
      setAccountName(account.name);
      setBalance(nextBalance);
      saveWidgetSnapshot(nextBalance);
      requestWidgetUpdateAdapter();
      setPie(nextPie);
      setPrevTotal(previousRange ? sumExpenses(prevPie) : null);
      setTrend(buildTrend(period, anchorMs, txs as Transaction[], locale));
      setRows(
        txs.slice(0, 100).map(tx => {
          const cat = tx.categoryId ? byId.get(tx.categoryId) : undefined;
          const catKey = `category.${cat?.id ?? ''}` as TranslationKey;
          const translated = cat ? t(catKey) : t(CATEGORY_FALLBACK);
          const title = cat && translated !== catKey ? translated : cat?.name ?? t(CATEGORY_FALLBACK);
          return {
            id: tx.id,
            categoryId: cat?.id,
            title,
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
      await syncScheduledNotifications(db).catch(error =>
        console.error('[home] notifications sync failed', error),
      );
      await runNotificationChecks(db).catch(error =>
        console.error('[home] notification checks failed', error),
      );
      if (!cancelled) {
        await refresh(range, prevRange);
      }
    })();

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [db, period, anchorMs, t, locale]);

  const confirmDelete = (id: string) => {
    Alert.alert(t('entry.delete'), t('tx.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('entry.delete'),
        style: 'destructive',
        onPress: () => {
          playSound('delete');
          deleteTransaction(db, id).catch(error => console.error('[home] delete failed', error));
        },
      },
    ]);
  };

  if (!ready) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <TopBar userName={userName} onOpenSettings={() => setSettingsOpen(true)} />
      <BalanceHeader balanceCents={balance} accountName={accountName} accountId={accountId} />
      <PeriodFilter
        period={period}
        anchorMs={anchorMs}
        onPeriodChange={setPeriod}
        onShift={direction => setAnchorMs(shiftAnchor(period, anchorMs, direction))}
        canGoPrev={canGoPrev}
      />
      <MonthDonut slices={pie} label={periodLabel} />
      {changePct !== null ? (
        <Text
          style={[
            styles.compare,
            { color: changePct > 0 ? palette.expense : palette.income },
          ]}>
          {`${changePct > 0 ? '▲' : '▼'} ${Math.abs(changePct)}% ${t('compare.vsPrevious')}`}
        </Text>
      ) : null}
      <TrendChart buckets={trend} width={chartWidth} />
      <TransactionList
        rows={rows}
        onSelect={id => {
          const row = rows.find(r => r.id === id);
          if (row && row.kind !== 'transfer') {
            openEdit({ id: row.id, kind: row.kind, amountCents: row.amountCents, note: row.note });
          }
        }}
        onDelete={confirmDelete}
      />
      <EntryActions onExpense={() => openSheet('expense')} onIncome={() => openSheet('income')} />
      <EntrySheet db={db} />
      <SettingsSheet
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        db={db}
        onOpenBudgets={() => {
          setSettingsOpen(false);
          setBudgetsOpen(true);
        }}
        onOpenRecurring={() => {
          setSettingsOpen(false);
          setRecurringOpen(true);
        }}
        onOpenNotifications={() => {
          setSettingsOpen(false);
          setNotificationsOpen(true);
        }}
      />
      <BudgetsSheet isOpen={budgetsOpen} onClose={() => setBudgetsOpen(false)} db={db} />
      <RecurringSheet isOpen={recurringOpen} onClose={() => setRecurringOpen(false)} db={db} />
      <NotificationsSheet
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />
    </SafeAreaView>
  );
}
