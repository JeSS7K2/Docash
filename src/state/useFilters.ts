import { create } from 'zustand';
import type { PeriodKind } from '../utils/dateRange';

interface FiltersState {
  /** Periodo visible (Fase 3). 'month' reproduce el comportamiento actual. */
  period: PeriodKind;
  /** Fecha de referencia del periodo, epoch ms. */
  anchorMs: number;
  /** Cuenta visible, null = todas (motor Fase 3, UI oculta). */
  accountId: string | null;
  setPeriod: (period: PeriodKind) => void;
  setAnchorMs: (anchorMs: number) => void;
  setAccountId: (accountId: string | null) => void;
}

// Estado efímero de UI. La fuente de verdad es SQLite vía observables.
// El rango [from,to) se deriva con rangeForPeriod(period, anchorMs).
export const useFilters = create<FiltersState>()(set => ({
  period: 'month',
  anchorMs: Date.now(),
  accountId: null,
  setPeriod: period => set({ period }),
  setAnchorMs: anchorMs => set({ anchorMs }),
  setAccountId: accountId => set({ accountId }),
}));
