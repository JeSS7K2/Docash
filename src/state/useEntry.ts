import { create } from 'zustand';
import { applyKey, centsToBuffer, INITIAL_BUFFER, normalizeBuffer, type NumpadKey } from '../utils/amountBuffer';
import type { EntryKind } from '../db/operations';

interface EntryState {
  open: boolean;
  kind: EntryKind;
  buffer: string;
  note: string;
  drafts: Record<EntryKind, string>;
  /** id de la transacción en edición, null = alta nueva. */
  editingId: string | null;
  editingCategoryId: string | null;
  editingOccurredOn: number | null;
  openSheet: (kind: EntryKind) => void;
  switchKind: (kind: EntryKind) => void;
  openEdit: (input: {
    id: string;
    kind: EntryKind;
    amountCents: number;
    categoryId?: string;
    note?: string;
    occurredOn?: number;
  }) => void;
  closeSheet: (options?: { preserveDraft?: boolean }) => void;
  pressKey: (key: NumpadKey) => void;
  setBuffer: (value: string) => void;
  setNote: (note: string) => void;
}

// Borrador efímero del registro en curso. La persistencia vive en SQLite.
export const useEntry = create<EntryState>()(set => ({
  open: false,
  kind: 'expense',
  buffer: INITIAL_BUFFER,
  note: '',
  drafts: { expense: INITIAL_BUFFER, income: INITIAL_BUFFER },
  editingId: null,
  editingCategoryId: null,
  editingOccurredOn: null,
  openSheet: kind =>
    set(state => ({
      open: true,
      kind,
      buffer: state.drafts[kind],
      note: '',
      editingId: null,
      editingCategoryId: null,
      editingOccurredOn: null,
    })),
  switchKind: kind =>
    set(state => state.editingId || state.kind === kind
      ? state
      : {
          kind,
          drafts: { ...state.drafts, [state.kind]: state.buffer },
          buffer: state.drafts[kind],
        }),
  openEdit: ({ id, kind, amountCents, categoryId, note, occurredOn }) =>
    set({
      open: true,
      kind,
      buffer: centsToBuffer(amountCents),
      note: note ?? '',
      editingId: id,
      editingCategoryId: categoryId ?? null,
      editingOccurredOn: occurredOn ?? null,
    }),
  closeSheet: ({ preserveDraft = true } = {}) =>
    set(state => ({
      open: false,
      drafts:
        preserveDraft && !state.editingId
          ? { ...state.drafts, [state.kind]: state.buffer }
          : preserveDraft
            ? state.drafts
            : { ...state.drafts, [state.kind]: INITIAL_BUFFER },
      buffer: INITIAL_BUFFER,
      note: '',
      editingId: null,
      editingCategoryId: null,
      editingOccurredOn: null,
    })),
  pressKey: key => set(state => ({ buffer: applyKey(state.buffer, key) })),
  setBuffer: value => set({ buffer: normalizeBuffer(value) }),
  setNote: note => set({ note: note.slice(0, 280) }),
}));
