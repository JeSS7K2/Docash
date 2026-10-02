// Paletas claro/oscuro. Toda la UI consume colores vía usePalette(), nunca
// constantes sueltas, para que el cambio de tema sea reactivo.
export interface Palette {
  paper: string;
  ink: string;
  muted: string;
  faint: string;
  track: string;
  expense: string;
  income: string;
  transfer: string;
  /** Tintes suaves por tipo, para cabeceras/acentos de los sheets. */
  expenseSoft: string;
  incomeSoft: string;
  /** Acento por modal (identidad visual de cada sheet). */
  primary: string;
  primarySoft: string;
  budget: string;
  budgetSoft: string;
  recurring: string;
  recurringSoft: string;
  onAction: string;
  border: string;
  overlay: string;
}

export const lightPalette: Palette = {
  paper: '#FFFFFF',
  ink: '#1A1D21',
  muted: '#7A828E',
  faint: '#F1F3F6',
  track: '#E8EAF0',
  expense: '#D32F2F',
  income: '#2E7D32',
  transfer: '#546E7A',
  expenseSoft: '#FBEAEA',
  incomeSoft: '#E6F4EA',
  primary: '#3B5BFF',
  primarySoft: '#E9EDFF',
  budget: '#B26A00',
  budgetSoft: '#FBEFDD',
  recurring: '#6D28D9',
  recurringSoft: '#F0E9FB',
  onAction: '#FFFFFF',
  border: '#E8EAF0',
  overlay: 'rgba(17,20,24,0.45)',
};

export const darkPalette: Palette = {
  paper: '#121417',
  ink: '#F2F4F7',
  muted: '#9AA3AF',
  faint: '#1E232B',
  track: '#2A2F38',
  expense: '#FF6B6B',
  income: '#4ADE80',
  transfer: '#94A3B8',
  expenseSoft: '#311A1C',
  incomeSoft: '#12291B',
  primary: '#7C93FF',
  primarySoft: '#1A2140',
  budget: '#E0A34D',
  budgetSoft: '#2E2413',
  recurring: '#B794F6',
  recurringSoft: '#241A38',
  onAction: '#FFFFFF',
  border: '#2A2F38',
  overlay: 'rgba(0,0,0,0.62)',
};
