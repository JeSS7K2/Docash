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
  paper: '#FFF9F0',
  ink: '#2A223B',
  muted: '#817890',
  faint: '#FFFFFF',
  track: '#E8E0F7',
  expense: '#FF826D',
  income: '#D5F36D',
  transfer: '#546E7A',
  expenseSoft: '#FFE8E3',
  incomeSoft: '#F0F8D7',
  primary: '#7455FF',
  primarySoft: '#EEE8FF',
  budget: '#7455FF',
  budgetSoft: '#EEE8FF',
  recurring: '#7455FF',
  recurringSoft: '#EEE8FF',
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
  expense: '#FF8A78',
  income: '#D5F36D',
  transfer: '#94A3B8',
  expenseSoft: '#311A1C',
  incomeSoft: '#12291B',
  primary: '#9B85FF',
  primarySoft: '#30264C',
  budget: '#9B85FF',
  budgetSoft: '#30264C',
  recurring: '#9B85FF',
  recurringSoft: '#30264C',
  onAction: '#FFFFFF',
  border: '#2A2F38',
  overlay: 'rgba(0,0,0,0.62)',
};
