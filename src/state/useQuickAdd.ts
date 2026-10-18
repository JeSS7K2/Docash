import { create } from 'zustand';
import type { EntryKind } from '../db/operations';

interface QuickAddState {
  open: boolean;
  kind: EntryKind;
  openWith: (kind: EntryKind) => void;
  close: () => void;
}

/** Alta rápida (DETALLES) lanzada desde el widget vía deep link. */
export const useQuickAdd = create<QuickAddState>()(set => ({
  open: false,
  kind: 'expense',
  openWith: kind => set({ open: true, kind }),
  close: () => set({ open: false }),
}));
