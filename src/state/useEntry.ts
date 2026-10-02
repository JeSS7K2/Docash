import { create } from 'zustand';
import { applyKey, centsToBuffer, INITIAL_BUFFER, type NumpadKey } from '../utils/amountBuffer';
import type { EntryKind } from '../db/operations';

interface EntryState {
  open: boolean;
  kind: EntryKind;
  buffer: string;
  note: string;
  /** id de la transacción en edición, null = alta nueva. */
  editingId: string | null;
  openSheet: (kind: EntryKind) => void;
  openEdit: (input: { id: string; kind: EntryKind; amountCents: number; note?: string }) => void;
  closeSheet: () => void;
  pressKey: (key: NumpadKey) => void;
  setNote: (note: string) => void;
}

// Borrador efímero del registro en curso. La persistencia vive en SQLite.
export const useEntry = create<EntryState>()(set => ({
  open: false,
  kind: 'expense',
  buffer: INITIAL_BUFFER,
  note: '',
  editingId: null,
  openSheet: kind => set({ open: true, kind, buffer: INITIAL_BUFFER, note: '', editingId: null }),
  openEdit: ({ id, kind, amountCents, note }) =>
    set({ open: true, kind, buffer: centsToBuffer(amountCents), note: note ?? '', editingId: id }),
  closeSheet: () => set({ open: false, buffer: INITIAL_BUFFER, note: '', editingId: null }),
  pressKey: key => set(state => ({ buffer: applyKey(state.buffer, key) })),
  setNote: note => set({ note: note.slice(0, 280) }),
}));
