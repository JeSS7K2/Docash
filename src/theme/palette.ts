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

// Azul confianza: blanco/gris limpio con primario azul, rojo gasto y verde
// ingreso. Look fintech sobrio; gasto/ingreso por semántica.
export const lightPalette: Palette = {
  paper: '#FFFFFF',
  ink: '#0D1A33',
  muted: '#64738A',
  faint: '#F4F7FA',
  track: '#E4EAF2',
  expense: '#D32F2F',
  income: '#2E7D32',
  transfer: '#546E7A',
  expenseSoft: '#FBEAEA',
  incomeSoft: '#E6F4EA',
  primary: '#0D70E8',
  primarySoft: '#EAF4FF',
  budget: '#0D70E8',
  budgetSoft: '#EAF4FF',
  recurring: '#0D70E8',
  recurringSoft: '#EAF4FF',
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
  primary: '#4D9CFF',
  primarySoft: '#142B49',
  budget: '#4D9CFF',
  budgetSoft: '#142B49',
  recurring: '#4D9CFF',
  recurringSoft: '#142B49',
  onAction: '#FFFFFF',
  border: '#2A2F38',
  overlay: 'rgba(0,0,0,0.62)',
};
